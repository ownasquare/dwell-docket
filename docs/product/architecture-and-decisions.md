# Product and architecture decisions

## Product job

A small carrier owner or dispatcher needs to reconcile completed stops after
the week is over. They already have timestamps, a rate, a paid amount, and a
few proof flags in a CSV, but manually rechecking every row makes small
detention amounts easy to abandon.

Dwell Docket turns that export into one follow-up docket without becoming a
TMS, dispatch board, live timer, document vault, invoicing system, or contract
engine.

## Hard interaction contract

The first-use workflow has:

- one screen;
- one file input expressed as one large drop zone;
- exactly one oversized primary button;
- no dropdown, select, settings, account, navigation, wizard, tutorial, API
  key, or credential field; and
- a result and download state on the same screen.

The action can be understood and initiated in under ten seconds. Upload and
processing latency are not represented as instantaneous; the current local
fixture completes quickly and the status live region announces progress.

## Architecture

```text
CSV file
  -> File.text()
  -> src/csv.js parser
  -> src/detention.js deterministic classifier
  -> src/app.js accessible result rendering
  -> downloadable browser Blob CSV
```

`index.html` provides the semantic shell. `src/styles.css` implements
mobile-first layout and automatic `prefers-color-scheme` tokens. `server.mjs`
is a minimal path-contained static development server with a health endpoint.
There is no runtime package dependency and no build step.

## Decision record

### Browser-local processing

Selected to keep the core path credential-free, preserve the CSV data boundary,
and make the app usable without infrastructure. A hosted API was rejected
because it would add transmission, storage, authentication, security, and
operating complexity without improving the deterministic transformation.

### After-the-fact reconciliation

Selected over a live detention timer. Timer products already exist and require
drivers to start, stop, annotate, and preserve a session. This app serves a
different trigger: a dispatcher has a completed stop export and needs to find
missed money.

### Explicit CSV schema

Selected over flexible column mapping because mapping would require multiple
inputs, choices, or a setup screen. Exact headings keep the transformation
auditable and the ten-second interaction intact. The sample file makes the
contract concrete.

### Deterministic calculation

Selected over an AI classifier because the monetary arithmetic and proof flags
need reproducible output. No model or paid provider is required.

### Proof gaps are review states

Missing BOL times, a missing signature, late notice, or arrival after the
appointment do not silently erase calculated money. They become
`evidence_gap`, separating calculation from contract eligibility.

### Static, zero-runtime-dependency application

Selected over React or another framework because the product needs one small
screen and no server state. Development-only packages supply tests, formatting,
and type analysis.

## Security and correctness boundaries

- File names must end in `.csv`; files over 5 MB are rejected.
- Parser output is rendered with `textContent`; CSV values are not inserted
  through `innerHTML`.
- The static server resolves paths inside the repository root.
- Result object URLs are revoked before replacement.
- Invalid rows are preserved with a repair reason instead of aborting valid
  rows.
- The tool supports reconciliation; the written rate confirmation decides
  whether a charge is collectible.

## Known limits

- Calculation uses elapsed clock minutes and does not model contract-specific
  rounding, business hours, exclusions, caps, or grace rules.
- `yes` is the only affirmative proof value.
- The on-screen preview is capped at 50 rows; the downloaded docket contains
  all rows.
- The application is not deployed or operated as a hosted service.
