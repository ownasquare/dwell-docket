# Dwell Docket Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: execute this plan inline, task-by-task, because the
> active automation owns one fixed non-renewable lane window. Steps use checkbox (`- [ ]`) syntax
> for tracking.

**Goal:** Build a one-screen local browser app that turns one stop-export CSV into a reviewable
detention-gap docket and downloadable CSV.

**Architecture:** Keep the runtime dependency-free. `src/csv.js` owns safe CSV parsing and
serialization, `src/detention.js` owns deterministic calculations and classifications, and
`src/app.js` owns the single browser workflow. A small loopback-only Node server serves static
files for Playwright and package smoke proof.

**Tech Stack:** HTML, CSS, browser/Node ES modules, Node test runner, ESLint, Prettier, TypeScript
check-JS, Playwright, axe-core.

---

## File map

- `src/csv.js`: parse quoted UTF-8 CSV and serialize formula-safe result CSV.
- `src/detention.js`: validate stop rows, calculate dwell and owed amounts, classify docket rows.
- `src/app.js`: file-drop, submit, progress, result, download, and recovery UI.
- `src/styles.css`: mobile-first automatic light/dark visual contract.
- `index.html`: one-screen semantic shell.
- `server.mjs`: loopback-only static server and health endpoint.
- `tests/*.test.js`: domain, CSV, and failure tests.
- `tests/e2e/dwell-docket.spec.js`: Playwright structure, workflow, accessibility, theme, and viewport proof.
- `scripts/*.mjs`: format/lint/type/secret/license/package audits.

### Task 1: Core CSV and detention contract

**Files:**

- Create: `tests/csv.test.js`
- Create: `tests/detention.test.js`
- Create: `src/csv.js`
- Create: `src/detention.js`

- [ ] **Step 1: Write failing CSV tests**

```js
test("parses quoted commas and escaped quotes", () => {
  assert.deepEqual(parseCsv('load_id,note\nL-1,"Dock, ""north"""'), [
    { load_id: "L-1", note: 'Dock, "north"' },
  ]);
});
```

- [ ] **Step 2: Run the focused tests and confirm missing modules fail**

Run: `node --test tests/csv.test.js tests/detention.test.js`

Expected: FAIL because `src/csv.js` and `src/detention.js` do not exist.

- [ ] **Step 3: Implement strict parsing and deterministic classification**

```js
export function classifyStop(row) {
  const dwellMinutes = differenceMinutes(row.arrived_at, row.departed_at);
  const billableMinutes = Math.max(0, dwellMinutes - Number(row.free_minutes));
  const owed = roundMoney((billableMinutes / 60) * Number(row.hourly_rate));
  return {
    ...row,
    dwell_minutes: dwellMinutes,
    billable_minutes: billableMinutes,
    owed,
  };
}
```

The final implementation must also validate all required headers, reject impossible times, compare
`paid_amount`, classify proof flags, and neutralize spreadsheet-formula prefixes on export.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/csv.test.js tests/detention.test.js`

Expected: all focused tests PASS.

### Task 2: One-screen browser workflow

**Files:**

- Create: `index.html`
- Create: `src/app.js`
- Create: `src/styles.css`
- Create: `examples/stops.csv`

- [ ] **Step 1: Create one semantic screen**

```html
<main>
  <h1>Find detention money your stop report missed.</h1>
  <input id="stop-file" type="file" accept=".csv,text/csv" />
  <button id="run" type="button">Find detention gaps</button>
  <section id="result" aria-live="polite"></section>
</main>
```

The file input must be represented by one large drop zone. No navigation, select, settings,
credential, login, onboarding, or second editable surface is allowed.

- [ ] **Step 2: Implement local file processing**

```js
runButton.addEventListener("click", async () => {
  setProgress();
  const rows = parseCsv(await selectedFile.text());
  renderDocket(buildDocket(rows));
});
```

- [ ] **Step 3: Implement friendly recovery**

Every failure must produce one short sentence and keep the same file drop zone as the recovery
action. Stale result content must be cleared before a new attempt.

- [ ] **Step 4: Run the local server and complete the sample workflow**

Run: `node server.mjs --port 4173`

Expected: `/healthz` returns `ok`, the sample produces categorized rows, and the result CSV
downloads locally.

### Task 3: Automated and rendered proof

**Files:**

- Create: `tests/e2e/dwell-docket.spec.js`
- Create: `playwright.config.mjs`
- Create: `package.json`
- Create: `eslint.config.js`
- Create: `tsconfig.json`

- [ ] **Step 1: Add Playwright contract assertions**

```js
await expect(page.locator("main")).toHaveCount(1);
await expect(page.locator('input[type="file"]')).toHaveCount(1);
await expect(page.locator("select")).toHaveCount(0);
await expect(
  page.getByRole("button", { name: "Find detention gaps" }),
).toHaveCount(1);
```

- [ ] **Step 2: Add real workflow and accessibility proof**

Upload `examples/stops.csv`, submit, assert category totals and download content, then run axe
against both empty and result states.

- [ ] **Step 3: Cover six responsive/theme combinations**

Run desktop, tablet, and mobile in emulated light and dark color schemes. Capture screenshots
under `proof/screenshots/`.

- [ ] **Step 4: Run the full validation matrix**

Run: `npm run validate`

Expected: unit tests, format, lint, typecheck, secret scan, license check, dependency audit, and
Playwright all PASS with no suppressed warnings.

### Task 4: Documentation, package, and release

**Files:**

- Create: `README.md`
- Create: `LICENSE`
- Create: `SECURITY.md`
- Create: `CONTRIBUTING.md`
- Create: `CHANGELOG.md`
- Create: `docs/product/architecture-and-decisions.md`
- Create: `docs/product/monetization-hypothesis.md`
- Create: `docs/dwell-docket/2026-07-27-completion.md`
- Create: `docs/handoffs/2026-07-27-codex-dwell-docket.handoff.mdc`
- Create: `proof/validation-receipt.json`

- [ ] **Step 1: Document the exact CSV and proof contracts**

Document required headings, calculations, local-only processing, limitations, commands, and
separate local/publication/hosted/production/provider/payment/demand proof.

- [ ] **Step 2: Prove install and package contents**

Run: `npm ci`, `npm pack --dry-run`, install the tarball in a fresh temporary directory, start the
packaged server, and read back `/healthz`.

Expected: intended files only, no broken dependencies, and a working packaged server.

- [ ] **Step 3: Create a clean main commit**

Stage only Dwell Docket repository files, commit, rerun the critical smoke checks, and verify a
clean worktree.

- [ ] **Step 4: Publish and close**

Use the scoped publisher, verify public `ownasquare/dwell-docket` main equals local `HEAD`, record
the receipt, write the immutable completed-app record, empty the lane queue, and call
`complete-app`.

## Self-review

- Spec coverage: every single-screen, one-input, one-action, local-first, documentation,
  validation, publication, state, and proof-label requirement maps to a task above.
- Placeholder scan: no deferred implementation placeholder remains.
- Type consistency: CSV row fields, calculation fields, module names, commands, and UI labels are
  consistent across tasks.
