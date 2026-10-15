-- Migration 0002: domain storage. Applied by scripts/migrate.mjs using owner credentials.
CREATE TABLE IF NOT EXISTS society_invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 society_id uuid NOT NULL REFERENCES societies(id),
 email text NOT NULL CHECK (email = lower(trim(email)) AND length(email) <= 320),
 role text NOT NULL CHECK (role IN ('treasurer','secretary','approver','member')),
 token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
 invited_by uuid NOT NULL REFERENCES users(id),
 expires_at timestamptz NOT NULL,
 accepted_at timestamptz,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(society_id,id),
 CHECK (NOT (accepted_at IS NOT NULL AND revoked_at IS NOT NULL)),
 CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS society_invitation_email_idx ON society_invitations(society_id,email);
CREATE TABLE IF NOT EXISTS burial_claims (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 society_id uuid NOT NULL REFERENCES societies(id),
 claimant_membership_id uuid NOT NULL,
 deceased_name text NOT NULL CHECK(length(trim(deceased_name)) BETWEEN 1 AND 200),
 event_date timestamptz NOT NULL,
 requested_cents bigint NOT NULL CHECK(requested_cents > 0),
 status text NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','reviewing','approved','rejected','cancelled')),
 submitted_by uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(society_id,id),
 FOREIGN KEY(society_id,claimant_membership_id) REFERENCES memberships(society_id,id)
);
CREATE INDEX IF NOT EXISTS burial_claim_status_idx ON burial_claims(society_id,status);
CREATE TABLE IF NOT EXISTS society_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 society_id uuid NOT NULL REFERENCES societies(id),
 claim_id uuid,
 storage_key text NOT NULL UNIQUE,
 filename text NOT NULL,
 mime_type text NOT NULL CHECK(mime_type IN ('application/pdf','image/jpeg','image/png','image/webp')),
 byte_size bigint NOT NULL CHECK(byte_size BETWEEN 1 AND 10485760),
 uploaded_by uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(society_id,id),
 FOREIGN KEY(society_id,claim_id) REFERENCES burial_claims(society_id,id)
);
CREATE TABLE IF NOT EXISTS billing_subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 society_id uuid NOT NULL REFERENCES societies(id),
 provider text NOT NULL CHECK(provider IN ('paystack','yoco')),
 provider_subscription_id text NOT NULL,
 plan text NOT NULL CHECK(plan IN ('starter','growth','pro')),
 status text NOT NULL CHECK(status IN ('pending','active','past_due','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(society_id,id),
 UNIQUE(provider,provider_subscription_id)
);
CREATE TABLE IF NOT EXISTS billing_webhook_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provider text NOT NULL,
 provider_event_id text NOT NULL,
 payload_sha256 text NOT NULL CHECK(payload_sha256 ~ '^[a-f0-9]{64}$'),
 received_at timestamptz NOT NULL DEFAULT now(),
 processed_at timestamptz,
 UNIQUE(provider,provider_event_id)
);
-- RLS is deny-by-default; no policies or runtime grants are provided.
ALTER TABLE society_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE burial_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_webhook_events ENABLE ROW LEVEL SECURITY;
