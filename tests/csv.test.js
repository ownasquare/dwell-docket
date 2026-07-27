import assert from "node:assert/strict";
import test from "node:test";

import { parseCsv, serializeCsv } from "../src/csv.js";

test("parses quoted commas, escaped quotes, and CRLF", () => {
  assert.deepEqual(parseCsv('load_id,stop_name\r\nL-1,"Dock, ""north"""\r\n'), {
    headers: ["load_id", "stop_name"],
    rows: [{ load_id: "L-1", stop_name: 'Dock, "north"' }],
  });
});

test("rejects unclosed quoted fields", () => {
  assert.throws(
    () => parseCsv('load_id,stop_name\nL-1,"Dock north'),
    /closed quotes/i,
  );
});

test("rejects duplicate and empty headings", () => {
  assert.throws(() => parseCsv("load_id,load_id\nL-1,L-2"), /unique/i);
  assert.throws(() => parseCsv("load_id,\nL-1,Dock"), /heading/i);
});

test("rejects rows with a different column count", () => {
  assert.throws(
    () => parseCsv("load_id,stop_name\nL-1"),
    /same number of columns/i,
  );
});

test("serializes quoted values and neutralizes spreadsheet formulas", () => {
  const csv = serializeCsv(
    ["load_id", "stop_name", "amount"],
    [{ load_id: "=2+2", stop_name: 'Dock "A", west', amount: 18.5 }],
  );
  assert.equal(
    csv,
    'load_id,stop_name,amount\r\n"\'=2+2","Dock ""A"", west",18.5\r\n',
  );
});
