const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser', timeout: 60000, workers: 1,
  use: { baseURL: 'http://localhost:8083', browserName: 'chromium', headless: true, viewport: { width: 390, height: 844 } },
});
