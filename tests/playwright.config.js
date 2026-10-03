const { defineConfig } = require('@playwright/test');
const { MAIN_URL } = require('./helpers');

module.exports = defineConfig({
	testDir: './specs',
	globalSetup: './global-setup.js',
	timeout: 30000,
	retries: 0,
	reporter: 'list',
	use: {
		baseURL: MAIN_URL,
		channel: process.env.PW_CHANNEL || undefined,
		viewport: { width: 1280, height: 800 },
	},
});
