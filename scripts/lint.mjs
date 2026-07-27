import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const ignored = new Set([
  ".git",
  "node_modules",
  "playwright-report",
  "test-results",
]);
const checkedExtensions = new Set([".js", ".mjs"]);
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (checkedExtensions.has(extname(path))) files.push(path);
  }
}

await walk(root);
const problems = [];
for (const file of files) {
  const check = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });
  if (check.status !== 0)
    problems.push(`${relative(root, file)} has invalid JavaScript.`);
  const source = await readFile(file, "utf8");
  if (/\beval\s*\(/.test(source))
    problems.push(`${relative(root, file)} uses eval.`);
  if (/\bTODO\b|\bFIXME\b/.test(source))
    problems.push(`${relative(root, file)} has a placeholder.`);
}

const html = await readFile(join(root, "index.html"), "utf8");
const forbidden = [
  ["<nav", "navigation"],
  ["<select", "a select"],
  ['type="password"', "a password field"],
  ["<textarea", "a second editable surface"],
];
for (const [needle, label] of forbidden) {
  if (html.toLowerCase().includes(needle))
    problems.push(`index.html contains ${label}.`);
}
if ((html.match(/<button\b/g) || []).length !== 1) {
  problems.push("index.html must contain exactly one button.");
}
if ((html.match(/type="file"/g) || []).length !== 1) {
  problems.push("index.html must contain exactly one file input.");
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(
  `${files.length} JavaScript files and the simplicity contract passed lint.`,
);
