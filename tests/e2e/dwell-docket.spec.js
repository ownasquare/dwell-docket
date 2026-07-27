import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const sample = fileURLToPath(
  new URL("../../examples/stops.csv", import.meta.url),
);

test("keeps the first-use workflow inside the hard simplicity gate", async ({
  page,
}) => {
  const consoleProblems = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()))
      consoleProblems.push(message.text());
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/Dwell Docket/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Find detention money",
  );
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator('input[type="file"]')).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Find detention gaps" }),
  ).toHaveCount(1);
  await expect(
    page.locator("nav, select, textarea, input[type=password]"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Find detention gaps" }),
  ).toBeDisabled();

  const emptyAccessibility = await new AxeBuilder({ page }).analyze();
  expect(emptyAccessibility.violations).toEqual([]);
  expect(consoleProblems).toEqual([]);
});

test("turns the sample stop export into a downloadable local docket", async ({
  page,
}, testInfo) => {
  const consoleProblems = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()))
      consoleProblems.push(message.text());
  });

  await page.goto("/");
  await page.locator("#stop-file").setInputFiles(sample);
  await expect(page.locator("#drop-title")).toHaveText("stops.csv");
  await page.getByRole("button", { name: "Find detention gaps" }).click();
  await expect(page.getByRole("status")).toHaveText("5 stops checked locally.");
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(
    "$387.50 may still be unrecovered",
  );
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await expect(
    page.getByText("Ready to follow up").locator("..").locator("strong"),
  ).toHaveText("1");
  await expect(
    page.getByText("Need proof review").locator("..").locator("strong"),
  ).toHaveText("1");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download docket CSV" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const contents = await readFile(path, "utf8");
  expect(contents).toContain("load_id,stop_name,status,reason");
  expect(contents).toContain("LD-100,North Dock,unrecovered");
  expect(contents).toContain("LD-102,West Warehouse,evidence_gap");

  const resultAccessibility = await new AxeBuilder({ page }).analyze();
  expect(resultAccessibility.violations).toEqual([]);
  expect(consoleProblems).toEqual([]);

  await page.screenshot({
    fullPage: true,
    path: `proof/screenshots/${testInfo.project.name}-result.png`,
  });
});
