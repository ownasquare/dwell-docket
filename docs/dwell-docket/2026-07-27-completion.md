# Dwell Docket completion evidence

Date: 2026-07-27  
Lane: 14 — Logistics, Fleet, and Field Operations  
Claim: `20260727T140411-0700-lane14-dwell-docket`  
App path:
`/Users/fortunevieyra/Documents/Github/ai-projects/factory-apps/lane-14/dwell-docket`

## Outcome

Dwell Docket is a complete local-first product that converts one stop CSV into
a deterministic detention-reconciliation docket. The sample identifies
`$387.50` that may remain unrecovered, separates proof gaps from immediately
actionable rows, preserves invalid rows for repair, and downloads the complete
result.

The empty and result screens preserve one input surface and exactly one
oversized primary action. No navigation, account, credentials, settings,
secondary page, paid provider, or application API is present.

## Validation evidence

- Unit tests: 13 passed.
- Playwright E2E: 12 passed across desktop, tablet, and mobile in light and
  dark appearance.
- Accessibility: axe reported zero violations in empty and result states.
- Console: no errors or warnings from the application.
- Download: sample result content and expected classifications verified.
- Screenshots: all six result images under `proof/screenshots/` were manually
  inspected for hierarchy, clipping, blank state, overlays, contrast, and
  errors.
- Dependency audit: zero known vulnerabilities at the release gate.
- Runtime dependencies: zero.

The exact final validation commands and Git publication evidence are recorded
in `proof/validation-receipt.json`.

## Failure correction log

The first Playwright run exposed a static-server path-containment bug: the
server root retained a trailing separator, which made valid files fail the
prefix check and return `403 Forbidden`. Normalizing the root with
`path.resolve` corrected the boundary without weakening containment.

The second run exposed four light-mode contrast combinations below WCAG AA and
a non-focusable horizontally scrollable mobile result table. Darker light-mode
status tokens and a labeled focusable scroll region corrected those issues.
The final matrix passed.

## Proof boundaries

- Local proof: complete and validated.
- GitHub publication proof: public
  `https://github.com/ownasquare/dwell-docket`, default branch `main`;
  validated implementation commit
  `91d1bc6a72ad0f30e22519c695668008e1d29f06` matched GitHub `main` at
  readback.
- Hosted proof: none; no application deployment was authorized.
- Production proof: none.
- Provider proof: none; no external provider is connected.
- Payment proof: none.
- Buyer, revenue, and usage proof: none.
- Demand proof: current public pain/workaround evidence only, not product-market
  fit.

## Completion documentation rule

This file documents the touched app repository. The lane claim, state,
completed-app record, automation memory, and cross-harness handoff provide the
corresponding AI Projects and scheduled-automation evidence.
