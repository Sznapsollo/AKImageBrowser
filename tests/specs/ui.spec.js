const { test, expect } = require('@playwright/test');

let pageErrors;

test.beforeEach(async ({ page }) => {
	pageErrors = [];
	page.on('pageerror', e => pageErrors.push(e.message));
	page.on('console', m => m.type() === 'error' && pageErrors.push(m.text()));
});

test.afterEach(() => {
	expect(pageErrors).toEqual([]);
});

const open = async (page, hash = '') => {
	await page.goto('/' + hash);
	await page.waitForSelector('.imageItem img');
};

test('loads the gallery with pager, version and header', async ({ page }) => {
	await open(page);
	await expect(page.locator('.imageItem a.fancybox')).toHaveCount(48);
	await expect(page.locator('.choosePageArea').nth(2)).toContainText('All:');
	await expect(page.locator('.pageFooter')).toContainText(/AKIB\s*AKImageBrowser v\d+\.\d+/);
	await expect(page.locator('.brandShort')).toHaveText('AKIB');
});

test('file name with html is shown as text, never executed', async ({ page }) => {
	let dialogs = 0;
	page.on('dialog', d => { dialogs++; d.dismiss(); });
	await open(page);
	await page.locator('a[href^="%3Cimg"]').click();
	const caption = page.locator('.fancybox__slide.is-selected .fancybox__caption');
	await expect(caption).toContainText('<img src=x onerror=alert(1)>.jpg');
	await page.waitForTimeout(300);
	expect(dialogs).toBe(0);
});

test('deep link opens an image with special characters', async ({ page }) => {
	await open(page, '#/images/0/48/a%2520b%2523.jpg');
	await expect(page.locator('.fancybox__slide.is-selected img')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page).toHaveURL(/#\/images\/0\/48$/);
});

test('deep link to an image not on the page does not crash', async ({ page }) => {
	await open(page, '#/images/0/48/missing.jpg');
	await expect(page.locator('.fancybox__container')).toHaveCount(0);
});

test('zoom buttons and keys, ignored while typing', async ({ page }) => {
	await open(page);
	const width = () => page.locator('.imageArea').first().evaluate(e => e.style.width);
	const start = await width();
	await page.locator('#zoomInButton').click();
	await page.keyboard.press('+');
	expect(await width()).toBe(parseInt(start) + 20 + 'px');
	await page.locator('.searchInput').focus();
	await page.keyboard.type('-+-');
	expect(await width()).toBe(parseInt(start) + 20 + 'px');
});

test('holding a zoom button keeps zooming, a click zooms once', async ({ page }) => {
	await open(page);
	const width = async () => parseInt(await page.locator('.imageArea').first().evaluate(e => e.style.width));
	const start = await width();
	await page.locator('#zoomInButton').click();
	expect(await width()).toBe(start + 10);
	const box = await page.locator('#zoomInButton').boundingBox();
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.waitForTimeout(1000);
	await page.mouse.up();
	const afterHold = await width();
	expect(afterHold).toBeGreaterThan(start + 10 + 50);
	await page.waitForTimeout(300);
	expect(await width()).toBe(afterHold);
	await page.locator('#zoomOutButton').focus();
	await page.keyboard.press('Enter');
	expect(await width()).toBe(afterHold - 10);
});

test('zoom in stops at the content width', async ({ page }) => {
	await open(page);
	const box = await page.locator('#zoomInButton').boundingBox();
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.waitForTimeout(3000);
	await page.mouse.up();
	const tile = await page.locator('.imageArea').first().evaluate(e => e.getBoundingClientRect().width);
	expect(tile).toBeLessThanOrEqual(await page.locator('#middleSection .inner').evaluate(e => e.clientWidth));
	expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('settings dialog closes with Esc and backdrop, saves options', async ({ page }) => {
	await open(page);
	const dialogOpen = () => page.locator('#settingsModal').evaluate(d => d.open);
	const openOptions = () => page.locator('a.nav-link', { hasText: 'Options' }).click();
	await openOptions();
	expect(await dialogOpen()).toBe(true);
	await page.keyboard.press('Escape');
	expect(await dialogOpen()).toBe(false);
	await openOptions();
	await page.mouse.click(5, 790);
	expect(await dialogOpen()).toBe(false);
	await openOptions();
	await page.locator('#settingsModal a', { hasText: 'reset' }).first().click();
	await expect(page).toHaveURL(/#\/images\/0\/48$/);
	await page.locator('#settingsModal input[type=checkbox]').nth(1).uncheck();
	await page.locator('#settingsModal button', { hasText: 'Save' }).click();
	await page.waitForSelector('.imageItem img');
	expect(await page.evaluate(() => localStorage.showFileNames)).toBe('false');
});

test('pager moves between pages', async ({ page }) => {
	await open(page);
	await page.locator('.pagerButtons a', { hasText: /^>$/ }).first().click();
	await expect(page).toHaveURL(/#\/images\/48\/48$/);
	await expect(page.locator('.imageItem a.fancybox').first()).toBeVisible();
	await page.locator('.pagerArea select').first().selectOption('12');
	await expect(page.locator('.imageItem a.fancybox')).toHaveCount(12);
});

test('about page shows version', async ({ page }) => {
	await open(page);
	await page.locator('a.nav-link', { hasText: 'About' }).click();
	await expect(page.locator('.inner')).toContainText(/v\d+\.\d+/);
});

test('tile modes: square crop and fit are uniform, original is not', async ({ page }) => {
	const heights = () => page.locator('.thumbBox').evaluateAll(els => [...new Set(els.map(e => Math.round(e.getBoundingClientRect().height)))]);
	for (const [mode, uniform] of [['crop', true], ['fit', true], ['original', false]]) {
		await page.goto('/');
		await page.evaluate(m => localStorage.tileMode = m, mode);
		await open(page);
		expect((await heights()).length === 1, mode).toBe(uniform);
	}
});

test('no horizontal scroll on a phone', async ({ browser }) => {
	const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
	const page = await context.newPage();
	await open(page);
	expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
	await context.close();
});
