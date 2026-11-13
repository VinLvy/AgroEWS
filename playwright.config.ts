import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "@playwright/test";

function resolveExecutablePath(): string | undefined {
  const envPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (envPath && existsSync(envPath)) return envPath;

  const candidates = [
    "C:\\Users\\ACER NITRO 5\\AppData\\Local\\ms-playwright\\chromium-1169\\chrome-win\\chrome.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    const pwDir = join(localAppData, "ms-playwright");
    if (existsSync(pwDir)) {
      for (const entry of readdirSync(pwDir).sort().reverse()) {
        if (entry.startsWith("chromium-")) {
          candidates.unshift(
            join(pwDir, entry, "chrome-win64", "chrome.exe"),
            join(pwDir, entry, "chrome-win", "chrome.exe"),
          );
        }
      }
    }
  }

  return candidates.find((p) => existsSync(p));
}

const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL = `http://127.0.0.1:${port}`;
const executablePath = resolveExecutablePath();

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
    baseURL,
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
    command: `node node_modules/next/dist/bin/next start -p ${port} -H 127.0.0.1`,
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.PLAYWRIGHT_PORT,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 30 * 1000,
    env: {
      APP_MOCK_DB: "true",
      PORT: port,
      HOSTNAME: "127.0.0.1",
      AUTH_URL: baseURL,
      NEXTAUTH_URL: baseURL,
      ...(process.env.NEXT_DIST_DIR ? { NEXT_DIST_DIR: process.env.NEXT_DIST_DIR } : {}),
    },
  },
});
