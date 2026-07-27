import { defineConfig } from "@playwright/test";

const surfaces = [
  { name: "desktop", viewport: { width: 1440, height: 1000 } },
  { name: "tablet", viewport: { width: 820, height: 1180 } },
  { name: "mobile", viewport: { width: 390, height: 844 } },
];

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:41714",
    browserName: "chromium",
    locale: "en-US",
    trace: "retain-on-failure",
  },
  projects: surfaces.flatMap((surface) =>
    ["light", "dark"].map((colorScheme) => ({
      name: `${surface.name}-${colorScheme}`,
      use: {
        colorScheme,
        viewport: surface.viewport,
      },
    })),
  ),
  webServer: {
    command: "node server.mjs --port 41714",
    url: "http://127.0.0.1:41714/healthz",
    reuseExistingServer: false,
    timeout: 20_000,
  },
});
