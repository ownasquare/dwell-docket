import assert from "node:assert/strict";
import test from "node:test";

import {
  REQUIRED_HEADERS,
  buildDocket,
  resultHeaders,
  toResultRows,
} from "../src/detention.js";

const base = {
  load_id: "LD-100",
  stop_name: "North Dock",
  appointment_at: "2026-07-20T08:00",
  arrived_at: "2026-07-20T07:55",
  departed_at: "2026-07-20T12:25",
  free_minutes: "120",
  hourly_rate: "75",
  paid_amount: "0",
  bol_times: "yes",
  bol_signed: "yes",
  notified_before_free_time: "yes",
};

test("publishes the exact required header contract", () => {
  assert.deepEqual(REQUIRED_HEADERS, Object.keys(base));
});

test("classifies an evidenced unpaid detention gap", () => {
  const docket = buildDocket(REQUIRED_HEADERS, [base]);
  assert.deepEqual(docket.summary, {
    total: 1,
    recovered: 0,
    unrecovered: 1,
    evidence_gap: 0,
    no_detention: 0,
    invalid: 0,
    total_unrecovered: 187.5,
  });
  assert.deepEqual(
    {
      dwell: docket.rows[0].dwell_minutes,
      billable: docket.rows[0].billable_minutes,
      owed: docket.rows[0].owed_amount,
      gap: docket.rows[0].unrecovered_amount,
      status: docket.rows[0].status,
    },
    {
      dwell: 270,
      billable: 150,
      owed: 187.5,
      gap: 187.5,
      status: "unrecovered",
    },
  );
});

test("classifies recovered and no-detention stops", () => {
  const recovered = { ...base, paid_amount: "187.50" };
  const short = {
    ...base,
    load_id: "LD-101",
    departed_at: "2026-07-20T09:25",
  };
  const docket = buildDocket(REQUIRED_HEADERS, [recovered, short]);
  assert.equal(docket.rows[0].status, "recovered");
  assert.equal(docket.rows[1].status, "no_detention");
  assert.equal(docket.summary.total_unrecovered, 0);
});

test("keeps calculated value visible when proof is incomplete", () => {
  const docket = buildDocket(REQUIRED_HEADERS, [
    { ...base, bol_signed: "no", notified_before_free_time: "no" },
  ]);
  assert.equal(docket.rows[0].status, "evidence_gap");
  assert.equal(docket.rows[0].unrecovered_amount, 187.5);
  assert.match(docket.rows[0].reason, /signed BOL/i);
  assert.match(docket.rows[0].reason, /notification/i);
});

test("does not decide eligibility when arrival follows appointment", () => {
  const docket = buildDocket(REQUIRED_HEADERS, [
    {
      ...base,
      arrived_at: "2026-07-20T08:15",
      departed_at: "2026-07-20T12:15",
    },
  ]);
  assert.equal(docket.rows[0].status, "evidence_gap");
  assert.match(docket.rows[0].reason, /after the appointment/i);
});

test("keeps invalid rows in the docket without inventing amounts", () => {
  const rows = [
    { ...base, departed_at: "2026-07-20T07:00" },
    { ...base, load_id: "LD-102", hourly_rate: "-1" },
    { ...base, load_id: "LD-103", arrived_at: "not-a-time" },
  ];
  const docket = buildDocket(REQUIRED_HEADERS, rows);
  assert.equal(docket.summary.invalid, 3);
  assert.equal(docket.summary.total_unrecovered, 0);
  assert.ok(docket.rows.every((row) => row.status === "invalid"));
  assert.ok(docket.rows.every((row) => row.owed_amount === ""));
});

test("rejects missing headings before row calculation", () => {
  assert.throws(
    () =>
      buildDocket(
        REQUIRED_HEADERS.filter((header) => header !== "paid_amount"),
        [base],
      ),
    /paid_amount/,
  );
});

test("exports only documented result fields", () => {
  const docket = buildDocket(REQUIRED_HEADERS, [base]);
  const result = toResultRows(docket.rows);
  assert.deepEqual(Object.keys(result[0]), resultHeaders);
  assert.equal(result[0].status, "unrecovered");
  assert.equal(result[0].unrecovered_amount, "187.50");
});
