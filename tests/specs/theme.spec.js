const { test, expect } = require('@playwright/test');

const LIGHT = 'rgb(236, 240, 241)';
const DARK = 'rgb(22, 24, 27)';

const background = page => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const button = (page, title) => page.locator(`.themeButton[title="${title}"]`);

test('auto mode follows the system, also when it changes', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/');
	await expect(button(page, 'Auto (system) mode')).toHaveClass(/active/);
	expect(await background(page)).toBe(LIGHT);
	await page.emulateMedia({ colorScheme: 'dark' });
	expect(await background(page)).toBe(DARK);
});

test('forced modes override the system and are remembered', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'dark' });
	await page.goto('/');
	await button(page, 'Light mode').click();
	expect(await background(page)).toBe(LIGHT);
	await page.reload();
	expect(await background(page)).toBe(LIGHT);
	await page.emulateMedia({ colorScheme: 'light' });
	await button(page, 'Dark mode').click();
	expect(await background(page)).toBe(DARK);
	await button(page, 'Auto (system) mode').click();
	expect(await background(page)).toBe(LIGHT);
});

test('forced theme is applied before the app scripts run', async ({ page }) => {
	await page.goto('/');
	await page.evaluate(() => localStorage.theme = 'dark');
	await page.addInitScript(() => document.addEventListener('readystatechange', () => {
		if (document.readyState === 'interactive') {
			window.__early = document.documentElement.getAttribute('data-theme') + '/' + typeof Vue;
		}
	}));
	await page.reload();
	expect(await page.evaluate(() => window.__early)).toBe('dark/undefined');
	expect(await background(page)).toBe(DARK);
});
