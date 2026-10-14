import { publicUrl, site } from "@/lib/site";

export function productMarkdown() {
  return `# ${site.name}

> ${site.tagline} A mobile-first administration prototype for South African rotating stokvels and burial societies.

## Product and audience

Designed for society treasurers, secretaries and committee members to keep contribution records, bank evidence and committee decisions clear. Society members should eventually have permitted views of their own records.

## Current status

This is a clickable prototype with a tested PostgreSQL financial foundation. The public demo uses fictional records in browser memory. Changes reset on refresh. Authentication, live society persistence, paid subscriptions and production onboarding are not enabled. Do not enter real personal or financial information.

## Demonstrated workflows

- Keep reported payments separate from verified contributions and outstanding obligations.
- Import a sample bank CSV and match evidence before verifying a receipt.
- Preview a locked rotating payout schedule, obtain two distinct committee approvals and record an external payment reference.
- Review burial benefit requests under captured rules and waiting periods; authorised humans record decisions.
- Review sample audit events, export a balanced monthly CSV and print reports using the browser's Save as PDF feature.
- Preview an aggregate WhatsApp update or use device sharing. The user chooses whether to send it.

## Financial boundaries

${site.name} does not hold money, issue insurance, guarantee benefits, make loans or automatically transfer funds. Societies use their existing bank accounts. A reported payment does not reduce the amount owed until verification and allocation. A scheduled payout is distinct from verified available funds and recorded external payment.

## PWA and privacy

The interface supports installation, system light/dark themes, safe areas and reduced motion. Its service worker caches public interface assets only. Offline navigation shows a non-sensitive reconnect page. Financial writes require an online connection; no offline payments or approvals are queued. Private financial information is not shared with a WhatsApp group by default.

## Pricing

The website's Community, Plus, Society and Administrator plans are pricing hypotheses for future pilots. They are not active subscription offers. There is no live checkout.

## Further reading

- [Website](${publicUrl()}): Public product overview and demo entry point.
- [Prototype privacy](${publicUrl("/privacy.md")}): Public privacy information in Markdown.
- [Repository](${site.repository}): Source, setup instructions and production-readiness limitations.
`;
}

export function privacyMarkdown() {
  return `# ${site.name} prototype privacy

The public prototype uses fictional society, member and financial records. Changes are held in browser memory and reset on refresh. Do not enter real identity, banking, death-related or financial information.

The prototype does not offer account registration, store documents, transmit payments or send automated messages. Downloaded reports contain sample data. WhatsApp sharing opens an aggregate preview; you choose whether to send it.

Fonts and the generated illustrative photograph are served locally. No analytics or advertising trackers are included. The hosting provider may retain standard request logs. Service-worker caches contain public interface assets, not private financial records or dashboard HTML.

A production POPIA privacy notice, processing terms and retention policy must be completed before real societies are onboarded.

- [Human-readable privacy page](${publicUrl("/privacy")})
- [Product status and boundaries](${publicUrl("/about.md")})
`;
}

export function llmsIndex() {
  return `# ${site.name}

> A South African rotating stokvel and burial society administration prototype. ${site.tagline}

The public app is a fictional-data demonstration, not a live financial service. Authentication, live society persistence, subscriptions and production onboarding are not enabled. Pricing is hypothetical. Do not describe sample members or balances as real customers or assets.

The platform does not hold or transfer money, provide insurance or guarantee benefits. Societies use existing bank accounts. Reported payments, verified contributions and recorded external payouts are separate states. Committee members decide burial requests under society rules.

These links describe public product information only. This file grants no access to private records and does not replace authentication, permissions or robots.txt.

## Product

- [Product overview and status](${publicUrl("/about.md")}): Demonstrated workflows, financial boundaries, PWA behaviour and pricing status.
- [Website](${publicUrl()}): Human-readable product overview.

## Privacy

- [Prototype privacy](${publicUrl("/privacy.md")}): Fictional data, sharing and hosting boundaries in Markdown.
- [Privacy page](${publicUrl("/privacy")}): Human-readable privacy information.

## Optional

- [Source and setup](${site.repository}#readme): Repository documentation.
- [Production readiness](${site.repository}/blob/main/docs/production-readiness.md): Outstanding release gates; do not treat these as completed capabilities.
- [Financial test cases](${site.repository}/blob/main/docs/financial-test-cases.md): Test scenarios for partial payments, approvals, reversals and tenant isolation.
`;
}

export function markdownResponse(content: string) {
  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
