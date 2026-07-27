import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const ignored = new Set([
  ".git",
  "node_modules",
  "playwright-report",
  "test-results",
  "proof",
  "secret-scan.mjs",
]);
const textExtensions = new Set([
  "",
  ".css",
  ".csv",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mdc",
  ".mjs",
]);
/** @type {Array<[string, RegExp]>} */
const patterns = [
  ["private key block", /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/],
  ["GitHub token", /gh[pousr]_[A-Za-z0-9]{30,}/],
  ["AWS access key", /AKIA[0-9A-Z]{16}/],
  [
    "generic assigned secret",
    /(?:api[_-]?key|secret|password)\s*[:=]\s*["'][^"']{8,}["']/i,
  ],
];
const findings = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!textExtensions.has(extname(path))) continue;
    const source = await readFile(path, "utf8");
    for (const [label, pattern] of patterns) {
      if (pattern.test(source))
        findings.push(`${relative(root, path)}: ${label}`);
    }
  }
}

await walk(root);
if (findings.length > 0) {
  console.error(findings.join("\n"));
  process.exit(1);
}
console.log("Secret-shape scan passed.");
