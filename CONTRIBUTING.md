# Contributing

Thank you for improving Dwell Docket.

## Product constraints

Preserve the complete primary workflow on one self-evident screen with:

- one CSV input surface;
- exactly one oversized primary action;
- no navigation, account, setup, settings, credential, or paid-service step;
- browser-local processing; and
- short plain-language recovery messages.

Do not add contract-specific eligibility rules unless they can remain explicit,
deterministic, tested, and optional without turning the workflow into a setup
form.

## Development

```sh
npm ci
npm run validate
```

Add deterministic Node tests for parser or classification changes. Use
Playwright only for E2E behavior; this repository does not use Cypress. Check
both automatic color schemes and all three responsive projects.

Before submitting a change:

1. Update the relevant product or architecture documentation.
2. Add a changelog entry.
3. Run the full validation command.
4. Inspect all six screenshots in `proof/screenshots/`.
5. Confirm `npm audit --audit-level=high` is clean.
6. Confirm no secret, real shipment record, customer data, or generated test
   output is staged unintentionally.

Keep commits narrowly scoped and use clear imperative messages.
