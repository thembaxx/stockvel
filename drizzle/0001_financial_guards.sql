-- All helpers have a fixed search_path. The migration owner must be separate from
-- the application role. The application role must not own tables or have BYPASSRLS.
CREATE FUNCTION app_actor() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('app.actor_id', true), '')::uuid $$;
CREATE FUNCTION app_society() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('app.society_id', true), '')::uuid $$;
CREATE FUNCTION society_role(tenant uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
  SELECT role FROM public.memberships WHERE society_id=tenant AND user_id=public.app_actor() AND ended_at IS NULL
$$;
REVOKE ALL ON FUNCTION society_role(uuid) FROM PUBLIC;
-- Grant EXECUTE only to the runtime role during deployment (see scripts/provision.sql).

CREATE FUNCTION prevent_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'append-only record: %', TG_TABLE_NAME USING ERRCODE='23514'; END $$;
CREATE TRIGGER rules_immutable BEFORE UPDATE OR DELETE ON rule_versions FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
CREATE TRIGGER obligations_immutable BEFORE UPDATE OR DELETE ON contribution_obligations FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
CREATE TRIGGER allocations_immutable BEFORE UPDATE OR DELETE ON payment_allocations FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
CREATE TRIGGER decisions_immutable BEFORE UPDATE OR DELETE ON approval_decisions FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON audit_events FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
CREATE TRIGGER bank_evidence_immutable BEFORE UPDATE OR DELETE ON bank_transactions FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
CREATE TRIGGER requests_immutable BEFORE UPDATE OR DELETE ON approval_requests FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

CREATE FUNCTION guard_journal_entry() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE line_count integer; debits numeric; credits numeric;
BEGIN
  IF TG_OP='DELETE' THEN
    IF OLD.status='posted' THEN RAISE EXCEPTION 'posted journal is immutable'; END IF; RETURN OLD;
  END IF;
  IF TG_OP='INSERT' AND NEW.status='posted' THEN RAISE EXCEPTION 'create draft, then post balanced lines'; END IF;
  IF TG_OP='UPDATE' AND OLD.status='posted' THEN RAISE EXCEPTION 'posted journal is immutable'; END IF;
  IF TG_OP='UPDATE' AND (NEW.society_id<>OLD.society_id OR NEW.actor_id<>OLD.actor_id OR NEW.idempotency_key<>OLD.idempotency_key OR NEW.id<>OLD.id) THEN RAISE EXCEPTION 'journal identity cannot change'; END IF;
  IF NEW.status='posted' THEN
    SELECT count(*),coalesce(sum(debit_cents),0),coalesce(sum(credit_cents),0) INTO line_count,debits,credits
    FROM journal_lines WHERE society_id=NEW.society_id AND entry_id=NEW.id;
    IF line_count<2 OR debits<=0 OR debits<>credits THEN RAISE EXCEPTION 'journal must balance before posting'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER journal_post_guard BEFORE INSERT OR UPDATE OR DELETE ON journal_entries FOR EACH ROW EXECUTE FUNCTION guard_journal_entry();
CREATE FUNCTION guard_journal_line() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE entry_status text;
BEGIN
  IF TG_OP='UPDATE' THEN RAISE EXCEPTION 'journal lines cannot be edited'; END IF;
  SELECT status INTO entry_status FROM journal_entries
  WHERE society_id=CASE WHEN TG_OP='DELETE' THEN OLD.society_id ELSE NEW.society_id END
  AND id=CASE WHEN TG_OP='DELETE' THEN OLD.entry_id ELSE NEW.entry_id END FOR UPDATE;
  IF entry_status='posted' THEN RAISE EXCEPTION 'posted journal lines are immutable'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER journal_lines_guard BEFORE INSERT OR UPDATE OR DELETE ON journal_lines FOR EACH ROW EXECUTE FUNCTION guard_journal_line();

CREATE FUNCTION guard_payment() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE bank_amount bigint; posted text;
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'payments cannot be deleted'; END IF;
  IF TG_OP='UPDATE' AND (NEW.amount_cents<>OLD.amount_cents OR NEW.membership_id<>OLD.membership_id OR NEW.society_id<>OLD.society_id OR NEW.idempotency_key<>OLD.idempotency_key OR NEW.reported_by<>OLD.reported_by OR NEW.reference<>OLD.reference) THEN RAISE EXCEPTION 'reported payment details cannot be rewritten'; END IF;
  IF TG_OP='UPDATE' AND OLD.status IN ('reversed','rejected') THEN RAISE EXCEPTION 'terminal payment record'; END IF;
  IF NEW.status='verified' THEN
    SELECT amount_cents INTO bank_amount FROM bank_transactions WHERE society_id=NEW.society_id AND id=NEW.bank_transaction_id;
    SELECT status INTO posted FROM journal_entries WHERE society_id=NEW.society_id AND id=NEW.journal_entry_id;
    IF bank_amount IS DISTINCT FROM NEW.amount_cents OR posted IS DISTINCT FROM 'posted' THEN RAISE EXCEPTION 'verification requires matching bank evidence and posted journal'; END IF;
  END IF;
  IF NEW.status='reversed' THEN
    IF TG_OP='INSERT' THEN RAISE EXCEPTION 'cannot insert reversed payment'; END IF;
    IF OLD.status<>'verified' OR NOT EXISTS(SELECT 1 FROM journal_entries WHERE society_id=NEW.society_id AND reverses_id=OLD.journal_entry_id AND status='posted') THEN RAISE EXCEPTION 'reversal requires a compensating posting'; END IF;
  END IF;
  IF TG_OP='UPDATE' AND OLD.status='verified' AND NEW.status<>'reversed' THEN RAISE EXCEPTION 'verified payment requires a reversal'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER payment_guard BEFORE INSERT OR UPDATE OR DELETE ON payments FOR EACH ROW EXECUTE FUNCTION guard_payment();

CREATE FUNCTION guard_allocation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE payment_amount bigint; obligation_amount bigint; payment_status text; payment_member uuid; obligation_member uuid; payment_allocated numeric; obligation_allocated numeric;
BEGIN
  -- Lock both records in a stable order. Concurrent allocations cannot overspend either balance.
  SELECT amount_cents,status,membership_id INTO payment_amount,payment_status,payment_member FROM payments WHERE society_id=NEW.society_id AND id=NEW.payment_id FOR UPDATE;
  SELECT amount_cents,membership_id INTO obligation_amount,obligation_member FROM contribution_obligations WHERE society_id=NEW.society_id AND id=NEW.obligation_id FOR UPDATE;
  IF payment_status IS DISTINCT FROM 'verified' OR payment_member IS DISTINCT FROM obligation_member THEN RAISE EXCEPTION 'allocate only a verified payment to its own member'; END IF;
  SELECT coalesce(sum(amount_cents),0) INTO payment_allocated FROM payment_allocations WHERE society_id=NEW.society_id AND payment_id=NEW.payment_id;
  SELECT coalesce(sum(a.amount_cents),0) INTO obligation_allocated FROM payment_allocations a JOIN payments p ON p.society_id=a.society_id AND p.id=a.payment_id WHERE a.society_id=NEW.society_id AND a.obligation_id=NEW.obligation_id AND p.status='verified';
  IF NEW.amount_cents+payment_allocated>payment_amount OR NEW.amount_cents+obligation_allocated>obligation_amount THEN RAISE EXCEPTION 'allocation exceeds verified payment or obligation'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER allocation_guard BEFORE INSERT ON payment_allocations FOR EACH ROW EXECUTE FUNCTION guard_allocation();

CREATE FUNCTION guard_approval() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE proposer uuid; reviewer_role text;
BEGIN
  SELECT proposer_id INTO proposer FROM approval_requests WHERE society_id=NEW.society_id AND id=NEW.request_id FOR UPDATE;
  SELECT role INTO reviewer_role FROM memberships WHERE society_id=NEW.society_id AND user_id=NEW.actor_id AND ended_at IS NULL;
  IF proposer IS NULL OR proposer=NEW.actor_id THEN RAISE EXCEPTION 'self approval is forbidden'; END IF;
  IF reviewer_role IS NULL OR reviewer_role NOT IN ('chairperson','treasurer','secretary','approver') THEN RAISE EXCEPTION 'authorised committee reviewer required'; END IF;
  IF app_actor() IS NOT NULL AND NEW.actor_id<>app_actor() THEN RAISE EXCEPTION 'approval actor does not match session'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER approval_guard BEFORE INSERT ON approval_decisions FOR EACH ROW EXECUTE FUNCTION guard_approval();

-- FORCE RLS applies to financial tables. Memberships alone is not forced because
-- society_role is owned by the migration owner and must inspect role assignments
-- without recursively invoking its own policy. The runtime role never owns it.
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY membership_access ON memberships USING(society_id=app_society() AND (user_id=app_actor() OR society_role(society_id) IN ('chairperson','treasurer','secretary','approver')));
CREATE POLICY society_access ON societies USING(id=app_society() AND society_role(id) IS NOT NULL);
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE societies FORCE ROW LEVEL SECURITY;
DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['rule_versions','contribution_obligations','ledger_accounts','journal_entries','journal_lines','bank_transactions','payments','payment_allocations','approval_requests','approval_decisions','audit_events'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',table_name);
    EXECUTE format('CREATE POLICY committee_access ON %I USING (society_id=app_society() AND society_role(society_id) IN (''chairperson'',''treasurer'',''secretary'',''approver'')) WITH CHECK (society_id=app_society() AND society_role(society_id) IN (''chairperson'',''treasurer'',''secretary'',''approver''))',table_name);
  END LOOP;
END $$;
CREATE POLICY own_payments ON payments FOR SELECT USING(society_id=app_society() AND membership_id IN(SELECT id FROM memberships WHERE user_id=app_actor() AND society_id=app_society()));
CREATE POLICY own_obligations ON contribution_obligations FOR SELECT USING(society_id=app_society() AND membership_id IN(SELECT id FROM memberships WHERE user_id=app_actor() AND society_id=app_society()));
-- Identity is not yet exposed via an auth API. Deny runtime reads of the user directory.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
-- Reads are committee-scoped; financial writes require the narrower financial role.
DO $$ DECLARE table_name text; BEGIN
 FOREACH table_name IN ARRAY ARRAY['journal_entries','journal_lines','bank_transactions','payments','payment_allocations'] LOOP
  EXECUTE format('DROP POLICY committee_access ON %I',table_name);
  EXECUTE format('CREATE POLICY committee_read ON %I FOR SELECT USING(society_id=app_society() AND society_role(society_id) IN (''chairperson'',''treasurer'',''secretary'',''approver''))',table_name);
  EXECUTE format('CREATE POLICY financial_insert ON %I FOR INSERT WITH CHECK(society_id=app_society() AND society_role(society_id) IN (''chairperson'',''treasurer''))',table_name);
  EXECUTE format('CREATE POLICY financial_update ON %I FOR UPDATE USING(society_id=app_society() AND society_role(society_id) IN (''chairperson'',''treasurer'')) WITH CHECK(society_id=app_society() AND society_role(society_id) IN (''chairperson'',''treasurer''))',table_name);
 END LOOP;
END $$;
-- Guard session-bound actor columns against accidental attribution to another person.
CREATE FUNCTION guard_actor() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor uuid;
BEGIN
 IF TG_TABLE_NAME='payments' THEN actor=NEW.reported_by; ELSE actor=NEW.actor_id; END IF;
 IF app_actor() IS NOT NULL AND actor<>app_actor() THEN RAISE EXCEPTION 'actor must match authenticated session'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER journal_actor_guard BEFORE INSERT ON journal_entries FOR EACH ROW EXECUTE FUNCTION guard_actor();
CREATE TRIGGER audit_actor_guard BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION guard_actor();
CREATE TRIGGER payment_actor_guard BEFORE INSERT ON payments FOR EACH ROW EXECUTE FUNCTION guard_actor();

CREATE FUNCTION guard_payment_journal_amount() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE bank_posted numeric; clearing_posted numeric;
BEGIN
 IF NEW.status='verified' THEN
  SELECT coalesce(sum(l.debit_cents-l.credit_cents) FILTER(WHERE a.code='bank'),0),coalesce(sum(l.credit_cents-l.debit_cents) FILTER(WHERE a.code='member-fund'),0)
  INTO bank_posted,clearing_posted FROM journal_lines l JOIN ledger_accounts a ON a.id=l.account_id AND a.society_id=l.society_id
  WHERE l.society_id=NEW.society_id AND l.entry_id=NEW.journal_entry_id;
  IF bank_posted<>NEW.amount_cents OR clearing_posted<>NEW.amount_cents THEN RAISE EXCEPTION 'journal amounts must match verified receipt'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER payment_journal_amount BEFORE INSERT OR UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION guard_payment_journal_amount();
