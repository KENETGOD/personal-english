import { defineConfig, devices } from "@playwright/test";

// Not 3000, so a developer server (possibly pointed at the remote project) never collides with E2E.
const port = 3100;

// E2E always targets the LOCAL Supabase stack (npx supabase start). These are the fixed, public
// local-demo values; process env takes precedence over .env.local, so the remote project is never used.
const localSupabaseEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
};

export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${port}`, trace: "on-first-retry" },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    // RNF-USA-01: mobile-first, usable from 360 px wide.
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 780 } },
    },
  ],
  webServer: {
    // NEXT_PUBLIC_* values are inlined at build time, so CI builds with the local env too.
    command: process.env.CI
      ? `npm run build && npm run start -- -p ${port}`
      : `npm run dev -- -p ${port}`,
    url: `http://localhost:${port}`,
    env: localSupabaseEnv,
    timeout: 240_000,
    // Never reuse a server that may be pointing at the remote project.
    reuseExistingServer: false,
  },
});
