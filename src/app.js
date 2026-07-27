import { parseCsv, serializeCsv } from "./csv.js";
import { buildDocket, resultHeaders, toResultRows } from "./detention.js";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const input = /** @type {HTMLInputElement} */ (
  document.querySelector("#stop-file")
);
const dropZone = /** @type {HTMLElement} */ (
  document.querySelector("#drop-zone")
);
const dropTitle = /** @type {HTMLElement} */ (
  document.querySelector("#drop-title")
);
const dropHint = /** @type {HTMLElement} */ (
  document.querySelector("#drop-hint")
);
const runButton = /** @type {HTMLButtonElement} */ (
  document.querySelector("#run")
);
const status = /** @type {HTMLElement} */ (document.querySelector("#status"));
const result = /** @type {HTMLElement} */ (document.querySelector("#result"));
let selectedFile = null;
let downloadUrl = null;

function setStatus(message, error = false) {
  status.textContent = message;
  status.classList.toggle("is-error", error);
}

function clearResult() {
  result.hidden = true;
  result.replaceChildren();
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  downloadUrl = null;
}

function chooseFile(file) {
  clearResult();
  setStatus("");
  selectedFile = null;
  runButton.disabled = true;

  if (!file) {
    dropTitle.textContent = "Drop one stop CSV";
    dropHint.textContent = "or choose a file";
    return;
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    setStatus("Choose a CSV file and try again.", true);
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    setStatus("Choose a CSV smaller than 5 MB and try again.", true);
    return;
  }

  selectedFile = file;
  dropTitle.textContent = file.name;
  dropHint.textContent = `${Math.max(1, Math.ceil(file.size / 1024))} KB · ready to check`;
  runButton.disabled = false;
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function labelStatus(value) {
  return value
    .replace("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderResult(docket) {
  const csv = serializeCsv(resultHeaders, toResultRows(docket.rows));
  downloadUrl = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );

  const heading = document.createElement("div");
  heading.className = "result-head";
  heading.innerHTML = `
    <div>
      <p class="result-kicker">Docket ready</p>
      <h2 id="result-title">${money(docket.summary.total_unrecovered)} may still be unrecovered</h2>
    </div>
  `;

  const download = document.createElement("a");
  download.className = "download-link";
  download.href = downloadUrl;
  download.download = "dwell-docket-results.csv";
  download.textContent = "Download docket CSV";
  heading.append(download);

  const summary = document.createElement("div");
  summary.className = "summary-grid";
  const items = [
    [docket.summary.unrecovered, "Ready to follow up"],
    [docket.summary.evidence_gap, "Need proof review"],
    [docket.summary.recovered, "Recovered"],
    [docket.summary.invalid, "Need row repair"],
  ];
  for (const [value, label] of items) {
    const item = document.createElement("div");
    item.className = "summary-item";
    item.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
    summary.append(item);
  }

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap";
  tableWrap.tabIndex = 0;
  tableWrap.setAttribute("aria-label", "Detention docket results");
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Load</th>
        <th scope="col">Stop</th>
        <th scope="col">Status</th>
        <th scope="col">Owed</th>
        <th scope="col">Unrecovered</th>
        <th scope="col">Review</th>
      </tr>
    </thead>
  `;
  const body = document.createElement("tbody");
  for (const row of docket.rows.slice(0, 50)) {
    const tr = document.createElement("tr");
    const values = [
      row.load_id || "—",
      row.stop_name || "—",
      row.status,
      row.owed_amount === "" ? "—" : money(row.owed_amount),
      row.unrecovered_amount === "" ? "—" : money(row.unrecovered_amount),
      row.reason,
    ];
    values.forEach((value, index) => {
      const cell = document.createElement("td");
      if (index === 2) {
        const pill = document.createElement("span");
        pill.className = `pill pill--${row.status}`;
        pill.textContent = labelStatus(row.status);
        cell.append(pill);
      } else {
        cell.textContent = value;
      }
      tr.append(cell);
    });
    body.append(tr);
  }
  table.append(body);
  tableWrap.append(table);
  result.append(heading, summary, tableWrap);
  result.hidden = false;
}

input.addEventListener("change", () => chooseFile(input.files?.[0]));

for (const eventName of ["dragenter", "dragover"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragging");
  });
}
dropZone.addEventListener("drop", (event) => {
  const dragEvent = /** @type {DragEvent} */ (event);
  chooseFile(dragEvent.dataTransfer?.files?.[0]);
});

runButton.addEventListener("click", async () => {
  if (!selectedFile) {
    setStatus("Choose a stop CSV and try again.", true);
    return;
  }
  clearResult();
  runButton.disabled = true;
  runButton.setAttribute("aria-busy", "true");
  setStatus("Checking every stop…");

  try {
    await new Promise((resolve) => window.setTimeout(resolve, 80));
    const { headers, rows } = parseCsv(await selectedFile.text());
    const docket = buildDocket(headers, rows);
    renderResult(docket);
    setStatus(`${docket.summary.total} stops checked locally.`);
  } catch {
    setStatus(
      "This CSV needs the Dwell Docket headings; choose another file and try again.",
      true,
    );
  } finally {
    runButton.disabled = false;
    runButton.removeAttribute("aria-busy");
  }
});
