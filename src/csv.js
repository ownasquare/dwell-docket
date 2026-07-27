function parseRecords(input) {
  const text = input.replace(/^\uFEFF/, "");
  const records = [];
  let record = [];
  let field = "";
  let quoted = false;
  let justClosedQuote = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          justClosedQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (justClosedQuote && ![",", "\r", "\n"].includes(character)) {
      throw new Error("Quoted CSV fields must end before the next column.");
    }
    if (character === '"') {
      if (field.length > 0 || justClosedQuote) {
        throw new Error("CSV quotes must begin at the start of a field.");
      }
      quoted = true;
      continue;
    }
    if (character === ",") {
      record.push(field);
      field = "";
      justClosedQuote = false;
      continue;
    }
    if (character === "\r" || character === "\n") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      record.push(field);
      if (record.some((value) => value.trim() !== "")) records.push(record);
      record = [];
      field = "";
      justClosedQuote = false;
      continue;
    }
    field += character;
    justClosedQuote = false;
  }

  if (quoted)
    throw new Error("The CSV needs closed quotes before it can be checked.");
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    if (record.some((value) => value.trim() !== "")) records.push(record);
  }
  return records;
}

export function parseCsv(input) {
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error("Choose a CSV with a heading row and at least one stop.");
  }

  const records = parseRecords(input);
  if (records.length < 2) {
    throw new Error("The CSV needs a heading row and at least one stop.");
  }

  const headers = records[0].map((header) => header.trim());
  if (headers.some((header) => header === "")) {
    throw new Error("Every CSV column needs a heading.");
  }
  if (new Set(headers).size !== headers.length) {
    throw new Error("Every CSV heading must be unique.");
  }

  const rows = records.slice(1).map((record, index) => {
    if (record.length !== headers.length) {
      throw new Error(
        `CSV row ${index + 2} needs the same number of columns as the heading row.`,
      );
    }
    return Object.fromEntries(
      headers.map((header, column) => [header, record[column].trim()]),
    );
  });

  return { headers, rows };
}

function safeCell(value) {
  const raw = value == null ? "" : String(value);
  const formulaLike = /^[=+\-@]/.test(raw);
  const safe = formulaLike ? `'${raw}` : raw;
  if (formulaLike || /[",\r\n]/.test(safe))
    return `"${safe.replaceAll('"', '""')}"`;
  return safe;
}

export function serializeCsv(headers, rows) {
  const lines = [
    headers.map(safeCell).join(","),
    ...rows.map((row) =>
      headers.map((header) => safeCell(row[header])).join(","),
    ),
  ];
  return `${lines.join("\r\n")}\r\n`;
}
