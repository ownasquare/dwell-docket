# Dwell Docket

Dwell Docket turns one stop-export CSV into a local detention reconciliation
docket. It separates stops that may still be recoverable from stops already
paid, stops that need proof review, stops without billable detention, and rows
that need repair.

The complete workflow stays on one screen: choose or drop one CSV, press one
large action, review the docket, and download the result. Processing happens
inside the browser. The app has no login, credentials, paid service, analytics,
or network API.

## Run locally

Requirements:

- Node.js 22 or newer
- npm

```sh
npm ci
npm start
```

Open `http://127.0.0.1:4173`, drop
[`examples/stops.csv`](examples/stops.csv), and press **Find detention gaps**.
The sample produces five classified stops and `$387.50` in potentially
unrecovered detention.

## CSV contract

The first row must contain these exact headings:

| Heading                     | Meaning                                           |
| --------------------------- | ------------------------------------------------- |
| `load_id`                   | Load or shipment identifier                       |
| `stop_name`                 | Facility or stop label                            |
| `appointment_at`            | Appointment date and time                         |
| `arrived_at`                | Arrival date and time                             |
| `departed_at`               | Departure date and time                           |
| `free_minutes`              | Non-billable dwell allowance                      |
| `hourly_rate`               | Agreed detention rate                             |
| `paid_amount`               | Amount already recovered                          |
| `bol_times`                 | `yes` when in/out times are written on the BOL    |
| `bol_signed`                | `yes` when the BOL is signed                      |
| `notified_before_free_time` | `yes` when notice was sent before free time ended |

Dates should use an unambiguous ISO-style value with a time-zone offset. Money
and minute fields must be zero or greater. Files must end in `.csv` and be no
larger than 5 MB.

The calculation is:

```text
billable minutes = max(0, departure - arrival - free minutes)
owed = billable minutes / 60 × hourly rate
unrecovered = max(0, owed - paid amount)
```

Rows are classified deterministically:

- `unrecovered`: money remains and all proof flags are present.
- `evidence_gap`: money remains but a proof flag is absent or arrival is late.
- `recovered`: the paid amount covers the calculated detention.
- `no_detention`: dwell did not exceed free time.
- `invalid`: a required row value cannot be calculated.

The downloaded docket preserves the source fields and adds status, review
reason, dwell, billable time, owed amount, paid amount, and unrecovered amount.
The on-screen table previews the first 50 rows; the download contains every
row.

## Validation

```sh
npm test
npm run format:check
npm run lint
npm run typecheck
npm run audit:secrets
npm run audit:license
npm audit --audit-level=high
npm run test:e2e
npm run validate
```

Playwright is the only E2E runner. It exercises the empty and completed
workflows at phone, tablet, and desktop sizes in light and dark appearance,
runs axe accessibility scans, checks console output, verifies the downloaded
CSV, and writes inspectable screenshots under `proof/screenshots/`.

## Boundaries

Dwell Docket is a reconciliation aid, not a contract interpreter, invoice
system, legal opinion, or guarantee of payment. A carrier's written rate
confirmation and documentation decide eligibility. The `$387.50` sample result
is a fixture, not revenue, buyer, demand, usage, payment, provider, hosted, or
production proof.

See:

- [Product and architecture decisions](docs/product/architecture-and-decisions.md)
- [Monetization hypothesis](docs/product/monetization-hypothesis.md)
- [Completion evidence](docs/dwell-docket/2026-07-27-completion.md)
- [Security policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

## License

[MIT](LICENSE)
