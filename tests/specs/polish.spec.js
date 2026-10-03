const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { FIXTURES } = require('../helpers');

const open = async (page, hash = '') => {
	await page.goto('/' + hash);
	await page.waitForSelector('.imageItem');
};

test('"/" focuses search, Esc clears it', async ({ page }) => {
	await open(page);
	await page.keyboard.press('/');
	await expect(page.locator('.searchInput')).toBeFocused();
	await page.keyboard.type('img1');
	await expect(page).toHaveURL(/search=img1/);
	await page.keyboard.press('Escape');
	await expect(page.locator('.searchInput')).toHaveValue('');
	await expect(page).toHaveURL(/#\/images\/0\/48$/);
});

test('caption shows dimensions and file size', async ({ page }) => {
	await open(page);
	await page.locator('a[href="wide.png"]').click();
	await expect(page.locator('.fancybox__slide.is-selected .fancybox__caption')).toContainText(/wide\.png .* · 900×200 · \d+(\.\d)? (B|KB)/);
});

test('copy link button copies the current url', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await open(page);
	await page.locator('a[href="wide.png"]').click();
	const button = page.locator('.fancybox__toolbar button[title="Copy link"]');
	await button.click();
	await expect(page.locator('.fancybox__toolbar button[title="Link copied"]')).toBeVisible();
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
});

test('video tiles show duration', async ({ page }) => {
	test.skip(!fs.existsSync(path.join(FIXTURES, 'main', 'clip.webm')), 'no fixture videos');
	await open(page);
	await expect(page.locator('a[href="clip.webm"] .durationBadge')).toHaveText('0:03');
});

test.describe('layout', () => {
	test('few items are centered, pager and footer sit at the bottom', async ({ page }) => {
		await open(page, '#/images/0/48?path=2024%2Fvacation%20%231');
		await expect(page.locator('.imageItem a.fancybox')).toHaveCount(3);
		const viewport = page.viewportSize();
		const box = async selector => page.locator(selector).first().boundingBox();
		const tiles = await page.locator('.imageItem').evaluateAll(els => els.map(e => e.getBoundingClientRect()));
		const left = Math.min(...tiles.map(t => t.left));
		const right = Math.max(...tiles.map(t => t.right));
		expect(Math.abs((left + right) / 2 - viewport.width / 2)).toBeLessThan(40);
		const middle = (tiles[0].top + tiles[0].bottom) / 2;
		expect(middle).toBeGreaterThan(viewport.height * 0.35);
		expect(middle).toBeLessThan(viewport.height * 0.65);
		expect((await box('.toolbar')).y).toBeLessThan(150);
		const footer = await box('.pageFooter');
		expect(footer.y + footer.height).toBeGreaterThan(viewport.height - 5);
		const bottomPager = await page.locator('.pagerArea').last().boundingBox();
		expect(bottomPager.y).toBeGreaterThan(viewport.height * 0.7);
	});
});
