const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { api, buildSite, startServer } = require('../helpers');

const open = async (page, url) => {
	await page.goto(url);
	await page.waitForSelector('.imageItem');
};

test.describe('folder listing cache and refresh versions', () => {
	let server;
	let dir;

	test.beforeAll(async () => {
		dir = buildSite('cache', { mode: 'small' });
		server = await startServer(dir, 8794);
	});

	test.afterAll(() => server && server.stop());

	test('listing is cached and unchanged pages answer with status 0', async () => {
		const old = Date.now() / 1000 - 60;
		fs.utimesSync(dir, old, old);
		const first = await api(server.url, {});
		expect(first.version).toMatch(/^[0-9a-f]{40}$/);
		expect(fs.readdirSync(path.join(dir, 'inc', '.cache')).some(f => f.startsWith('list-'))).toBe(true);
		const again = await api(server.url, { knownVersion: first.version });
		expect(again).toEqual({ status: 0, version: first.version });
	});

	test('a new file invalidates the cache and the version', async () => {
		const before = await api(server.url, {});
		fs.copyFileSync(path.join(dir, 'img1.jpg'), path.join(dir, 'brand-new.jpg'));
		const after = await api(server.url, { knownVersion: before.version });
		expect(after.status).toBeUndefined();
		expect(after.allCount).toBe(before.allCount + 1);
		expect(after.images[0].name).toBe('brand-new.jpg');
		fs.unlinkSync(path.join(dir, 'brand-new.jpg'));
		expect((await api(server.url, {})).allCount).toBe(before.allCount);
	});

	test('auto refresh only re-renders when the folder changed', async ({ page }) => {
		await page.goto(server.url);
		await page.evaluate(() => { localStorage.autoRefresh = 'true'; localStorage.autoRefreshInterval = '1'; });
		const statuses = [];
		page.on('response', async r => {
			if (r.url().includes('images.php')) {
				statuses.push((await r.json()).status === 0 ? 'unchanged' : 'full');
			}
		});
		await page.reload();
		await page.waitForSelector('.imageItem');
		const count = parseInt(await page.locator('.pagerCount').first().textContent());
		await expect.poll(() => statuses.length, { timeout: 5000 }).toBeGreaterThanOrEqual(3);
		expect(statuses.slice(1).every(s => s === 'unchanged')).toBe(true);
		fs.copyFileSync(path.join(dir, 'img1.jpg'), path.join(dir, 'zz-refresh.jpg'));
		await expect(page.locator('.pagerCount').first()).toHaveText(`${count + 1} items`, { timeout: 5000 });
		await expect(page.locator('.imageItem a.fancybox').first()).toHaveAttribute('href', 'zz-refresh.jpg');
		fs.unlinkSync(path.join(dir, 'zz-refresh.jpg'));
	});
});

test.describe('thumbnail generation limits', () => {
	let server;
	let dir;

	test.beforeAll(async () => {
		dir = buildSite('thumbclean', { mode: 'small', settings: { thumbnails: true, thumbnailSize: 100, thumbnailCacheMaxMB: 1 } });
		server = await startServer(dir, 8795);
	});

	test.afterAll(() => server && server.stop());

	test('when both generation slots are busy the original is served right away', async ({ request }) => {
		const thumbs = path.join(dir, 'inc', '.thumbs');
		fs.mkdirSync(thumbs, { recursive: true });
		const holder = spawn('php', ['-r', `$a = fopen('${thumbs}/.lock0', 'c'); $b = fopen('${thumbs}/.lock1', 'c'); flock($a, LOCK_EX); flock($b, LOCK_EX); echo "locked\\n"; sleep(10);`]);
		await new Promise(resolve => holder.stdout.once('data', resolve));
		const started = Date.now();
		const response = await request.get(server.url + 'inc/thumb.php?f=img2.jpg', { maxRedirects: 0 });
		holder.kill();
		expect(response.status()).toBe(302);
		expect(response.headers()['cache-control']).toBe('no-store');
		expect(Date.now() - started).toBeLessThan(4000);
	});

	test('cache cleanup removes stale thumbnails and keeps the size cap', async ({ request }) => {
		const thumbs = path.join(dir, 'inc', '.thumbs');
		fs.mkdirSync(thumbs, { recursive: true });
		const stale = path.join(thumbs, 'stale.webp');
		const big = path.join(thumbs, 'big.webp');
		fs.writeFileSync(stale, 'x');
		const old = Date.now() / 1000 - 40 * 86400;
		fs.utimesSync(stale, old, old);
		fs.writeFileSync(big, Buffer.alloc(2 * 1024 * 1024));
		fs.rmSync(path.join(thumbs, '.cleaned'), { force: true });
		const response = await request.get(server.url + 'inc/thumb.php?f=img3.jpg');
		expect(response.status()).toBe(200);
		expect(fs.existsSync(stale)).toBe(false);
		expect(fs.existsSync(big)).toBe(false);
	});
});

test.describe('navigation memory and keyboard', () => {
	test('back restores the scroll position, a new page starts at the top', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 600 });
		await open(page, '/#/images/0/24');
		await page.evaluate(() => window.scrollTo(0, 900));
		await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(900);
		await page.evaluate(() => [...document.querySelectorAll('.pageButton[aria-label="Next page"]')].pop().click());
		await expect(page).toHaveURL(/#\/images\/24\/24$/);
		await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(50);
		await page.goBack();
		await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(900);
	});

	test('opening and closing an image keeps the scroll position', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 600 });
		await open(page, '/#/images/0/48');
		await page.evaluate(() => window.scrollTo(0, 700));
		const tile = page.locator('.imageItem a.fancybox').nth(12);
		await tile.click();
		await expect(page.locator('.fancybox__container')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.locator('.fancybox__container')).toHaveCount(0);
		await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBeGreaterThan(400);
	});

	test('arrow keys move between tiles, Enter opens', async ({ page }) => {
		await open(page, '/#/images/0/48');
		const links = page.locator('.tiles .imageItem > a');
		await links.first().focus();
		await page.keyboard.press('ArrowRight');
		await expect(links.nth(1)).toBeFocused();
		const firstTop = (await links.nth(1).boundingBox()).y;
		await page.keyboard.press('ArrowDown');
		const focused = page.locator('.tiles .imageItem > a:focus');
		expect((await focused.boundingBox()).y).toBeGreaterThan(firstTop + 50);
		expect(Math.abs((await focused.boundingBox()).x - (await links.nth(1).boundingBox()).x)).toBeLessThan(5);
		await page.keyboard.press('Home');
		await expect(links.first()).toBeFocused();
		await page.keyboard.press('End');
		await expect(links.last()).toBeFocused();
		await focused.press('Enter');
		await expect(page.locator('.fancybox__container')).toBeVisible();
	});

	test('images have their file name as alt text', async ({ page }) => {
		await open(page, '/#/images/0/48');
		await expect(page.locator('a[href="wide.png"] img')).toHaveAttribute('alt', 'wide.png');
	});
});

test.describe('polish translation', () => {
	test.use({ locale: 'pl-PL' });

	test('browser language picks Polish, Options can switch language live', async ({ page }) => {
		await open(page, '/#/images/0/48');
		await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
		await expect(page.locator('.nav-link').first()).toHaveText('Opcje');
		await expect(page.locator('.pagerCount').first()).toHaveText(/^\d+ element(y|ów)?$/);
		await expect(page.locator('.searchInput')).toHaveAttribute('placeholder', 'Szukaj nazwy pliku ( / )');
		await page.locator('a[href="wide.png"]').click();
		await expect(page.locator('.fancybox__toolbar a.fancybox__button--download')).toHaveAttribute('title', 'Pobierz');
		await expect(page.locator('.fancybox__toolbar button.fancybox__button--copylink')).toHaveAttribute('title', 'Kopiuj link');
		await page.keyboard.press('Escape');
		await page.locator('.nav-link', { hasText: 'Opcje' }).click();
		await page.locator('#language').selectOption('en');
		await expect(page.locator('.nav-link').first()).toHaveText('Options');
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	});

	test('polish plural forms', async ({ page }) => {
		await page.goto('/');
		const forms = await page.evaluate(() => [1, 2, 5, 12, 22, 25].map(n => translate('pl', 'pager.items', { count: n }, n)));
		expect(forms).toEqual(['1 element', '2 elementy', '5 elementów', '12 elementów', '22 elementy', '25 elementów']);
	});
});
