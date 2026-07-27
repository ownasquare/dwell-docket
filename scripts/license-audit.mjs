import { readFile } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const packageJson = JSON.parse(
  await readFile(new URL("package.json", root), "utf8"),
);
const lock = JSON.parse(
  await readFile(new URL("package-lock.json", root), "utf8"),
);
const allowed = new Set([
  "0BSD",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "MIT",
  "MPL-2.0",
  "Python-2.0",
]);
const problems = [];

if (packageJson.license !== "MIT")
  problems.push("Project metadata must declare MIT.");
const license = await readFile(new URL("LICENSE", root), "utf8").catch(
  () => "",
);
if (!license.includes("MIT License"))
  problems.push("The MIT license text is missing.");

for (const [path, details] of Object.entries(lock.packages || {})) {
  if (!path || !path.startsWith("node_modules/")) continue;
  if (!details.license || !allowed.has(details.license)) {
    problems.push(`${path}: ${details.license || "missing license"}`);
  }
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(
  `${Object.keys(lock.packages || {}).length - 1} dependency license records passed.`,
);
