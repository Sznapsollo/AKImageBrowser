const { defineConfig } = require('@playwright/test');
const { MAIN_URL } = require('./helpers');

module.exports = defineConfig({
	testDir: './specs',
	globalSetup: './global-setup.js',
	timeout: 30000,
	expect: { timeout: 10000 },
	retries: 0,
	reporter: 'list',
	use: {
		baseURL: MAIN_URL,
		viewport: { width: 1280, height: 800 },
	},
	projects: [
		{ name: 'chromium', use: { browserName: 'chromium', channel: process.env.PW_CHANNEL || undefined } },
		{ name: 'firefox', use: { browserName: 'firefox' } },
		{ name: 'webkit', use: { browserName: 'webkit' } },
	],
});
