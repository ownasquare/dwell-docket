export const REQUIRED_HEADERS = [
  "load_id",
  "stop_name",
  "appointment_at",
  "arrived_at",
  "departed_at",
  "free_minutes",
  "hourly_rate",
  "paid_amount",
  "bol_times",
  "bol_signed",
  "notified_before_free_time",
];

export const resultHeaders = [
  "load_id",
  "stop_name",
  "status",
  "reason",
  "dwell_minutes",
  "billable_minutes",
  "owed_amount",
  "paid_amount",
  "unrecovered_amount",
  "appointment_at",
  "arrived_at",
  "departed_at",
  "free_minutes",
  "hourly_rate",
  "bol_times",
  "bol_signed",
  "notified_before_free_time",
];

function money(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseNumber(value, label) {
  if (value === "" || !Number.isFinite(Number(value)) || Number(value) < 0) {
    throw new Error(`${label} must be zero or more.`);
  }
  return Number(value);
}

function parseTime(value, label) {
  const timestamp = Date.parse(value);
  if (value === "" || !Number.isFinite(timestamp)) {
    throw new Error(`${label} needs a valid date and time.`);
  }
  return timestamp;
}

function isYes(value) {
  return value.trim().toLowerCase() === "yes";
}

function invalidRow(row, reason) {
  return {
    ...row,
    status: "invalid",
    reason,
    dwell_minutes: "",
    billable_minutes: "",
    owed_amount: "",
    paid_amount_value: "",
    unrecovered_amount: "",
  };
}

function classify(row) {
  try {
    if (!row.load_id) throw new Error("Load ID is missing.");
    if (!row.stop_name) throw new Error("Stop name is missing.");

    const appointment = parseTime(row.appointment_at, "Appointment");
    const arrived = parseTime(row.arrived_at, "Arrival");
    const departed = parseTime(row.departed_at, "Departure");
    if (departed < arrived) throw new Error("Departure must be after arrival.");

    const freeMinutes = parseNumber(row.free_minutes, "Free minutes");
    const hourlyRate = parseNumber(row.hourly_rate, "Hourly rate");
    const paidAmount = parseNumber(row.paid_amount, "Paid amount");
    const dwellMinutes = Math.round((departed - arrived) / 60_000);
    const billableMinutes = Math.max(0, dwellMinutes - freeMinutes);
    const owedAmount = money((billableMinutes / 60) * hourlyRate);
    const unrecoveredAmount = money(Math.max(0, owedAmount - paidAmount));

    let status = "unrecovered";
    let reason = "Detention is calculated and the proof flags are present.";
    const proofGaps = [];
    if (!isYes(row.bol_times)) proofGaps.push("written in/out times");
    if (!isYes(row.bol_signed)) proofGaps.push("a signed BOL");
    if (!isYes(row.notified_before_free_time))
      proofGaps.push("notification before free time ended");
    if (arrived > appointment)
      proofGaps.push("arrival was after the appointment");

    if (billableMinutes === 0) {
      status = "no_detention";
      reason = "The stop did not exceed its free time.";
    } else if (unrecoveredAmount === 0) {
      status = "recovered";
      reason = "The paid amount covers the calculated detention.";
    } else if (proofGaps.length > 0) {
      status = "evidence_gap";
      reason = `Review ${proofGaps.join(", ")}.`;
    }

    return {
      ...row,
      status,
      reason,
      dwell_minutes: dwellMinutes,
      billable_minutes: billableMinutes,
      owed_amount: owedAmount,
      paid_amount_value: money(paidAmount),
      unrecovered_amount: unrecoveredAmount,
    };
  } catch (error) {
    return invalidRow(
      row,
      error instanceof Error ? error.message : "This row could not be checked.",
    );
  }
}

export function buildDocket(headers, rows) {
  const missing = REQUIRED_HEADERS.filter(
    (header) => !headers.includes(header),
  );
  if (missing.length > 0) {
    throw new Error(`The CSV is missing: ${missing.join(", ")}.`);
  }
  if (rows.length === 0) throw new Error("The CSV needs at least one stop.");

  const docketRows = rows.map(classify);
  const statuses = [
    "recovered",
    "unrecovered",
    "evidence_gap",
    "no_detention",
    "invalid",
  ];
  const summary = Object.fromEntries(statuses.map((status) => [status, 0]));
  summary.total = docketRows.length;
  summary.total_unrecovered = 0;

  for (const row of docketRows) {
    summary[row.status] += 1;
    if (row.status !== "invalid") {
      summary.total_unrecovered = money(
        summary.total_unrecovered + row.unrecovered_amount,
      );
    }
  }

  return {
    rows: docketRows,
    summary: {
      total: summary.total,
      recovered: summary.recovered,
      unrecovered: summary.unrecovered,
      evidence_gap: summary.evidence_gap,
      no_detention: summary.no_detention,
      invalid: summary.invalid,
      total_unrecovered: summary.total_unrecovered,
    },
  };
}

function decimal(value) {
  return value === "" ? "" : Number(value).toFixed(2);
}

export function toResultRows(rows) {
  return rows.map((row) => ({
    load_id: row.load_id,
    stop_name: row.stop_name,
    status: row.status,
    reason: row.reason,
    dwell_minutes: row.dwell_minutes,
    billable_minutes: row.billable_minutes,
    owed_amount: decimal(row.owed_amount),
    paid_amount: decimal(row.paid_amount_value),
    unrecovered_amount: decimal(row.unrecovered_amount),
    appointment_at: row.appointment_at,
    arrived_at: row.arrived_at,
    departed_at: row.departed_at,
    free_minutes: row.free_minutes,
    hourly_rate: row.hourly_rate,
    bol_times: row.bol_times,
    bol_signed: row.bol_signed,
    notified_before_free_time: row.notified_before_free_time,
  }));
}
