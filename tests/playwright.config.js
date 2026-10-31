// Browser tests: open src/index.html straight from disk (file://) in three engines.
// Run with: npm run test:browser
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');

// macOS 27 puts ~/Library/Application Support/Firefox behind Full Disk Access, and Playwright's
// Firefox 157 looks there at startup, failing with "Could not find profile folder".
// Giving it an empty home folder of its own avoids that (microsoft/playwright#42768).
const firefoxLaunchOptions = process.platform === 'darwin'
  ? { env: { ...process.env, CFFIXED_USER_HOME: fs.mkdtempSync(path.join(os.tmpdir(), 'pw-firefox-home-')) } }
  : {};

module.exports = defineConfig({
  testDir: './browser',
  outputDir: '../test-results',
  fullyParallel: true,
  forbidOnly: true,
  // The test runner has hung twice on this Mac (macOS 27) for no reason we could reproduce.
  // A normal run takes under a minute; after 5 minutes the run stops and reports as failed.
  // No automatic retries on purpose, so a flaky run stays visible.
  globalTimeout: 5 * 60 * 1000,
  retries: 0,
  reporter: 'list',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], launchOptions: firefoxLaunchOptions } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
