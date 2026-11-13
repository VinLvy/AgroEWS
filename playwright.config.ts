import { defineConfig } from "@playwright/test";

const executablePath =
  "C:\\Users\\ACER NITRO 5\\AppData\\Local\\ms-playwright\\chromium-1169\\chrome-win\\chrome.exe";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    launchOptions: {
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Mobile (360px)",
      use: {
        viewport: { width: 360, height: 740 },
        isMobile: true,
      },
    },
    {
      name: "Tablet (768px)",
      use: {
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "Desktop (1280px)",
      use: {
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: "node node_modules/next/dist/bin/next start -p 3000 -H 127.0.0.1",
    url: "http://127.0.0.1:3000/login",
    reuseExistingServer: true,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 30 * 1000,
    env: {
      APP_MOCK_DB: "true",
      PORT: "3000",
      HOSTNAME: "127.0.0.1",
    },
  },
});
