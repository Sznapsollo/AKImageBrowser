const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { api, buildSite, startServer, MAIN_URL } = require('../helpers');

test('thumbnails are off by default', async () => {
	const data = await api(MAIN_URL, {});
	expect(data.images.every(i => i.thumb === null)).toBe(true);
});

test.describe('with thumbnails enabled', () => {
	let server;
	let dir;

	test.beforeAll(async () => {
		dir = buildSite('thumbs', { settings: { thumbnails: true, thumbnailSize: 100 } });
		server = await startServer(dir, 8792);
	});

	test.afterAll(() => server && server.stop());

	test('api returns thumb urls for images, not for videos', async () => {
		const data = await api(server.url, { itemsPerPage: 1000 });
		const byName = Object.fromEntries(data.images.map(i => [i.name, i]));
		expect(byName['img1.jpg'].thumb).toMatch(/^inc\/thumb\.php\?f=img1\.jpg&v=\d+$/);
		if (byName['clip.webm']) {
			expect(byName['clip.webm'].thumb).toBeNull();
		}
		const folder = data.folders.find(f => f.name === '2024');
		expect(folder.previewThumb).toMatch(/^inc\/thumb\.php\?f=2024%2Fp1\.jpg/);
	});

	test('thumbnail is small, cached and keeps aspect ratio', async ({ request }) => {
		const response = await request.get(server.url + 'inc/thumb.php?f=tall.jpg');
		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toMatch(/^image\/(webp|jpeg)$/);
		const original = fs.statSync(path.join(dir, 'tall.jpg')).size;
		expect((await response.body()).length).toBeLessThan(original);
		const cached = fs.readdirSync(path.join(dir, 'inc', '.thumbs')).filter(f => !f.startsWith('.'));
		expect(cached.length).toBeGreaterThan(0);
	});

	test('folder thumbnail with special characters', async ({ request }) => {
		const response = await request.get(server.url + 'inc/thumb.php?f=' + encodeURIComponent('2024/vacation #1/v1.jpg'));
		expect(response.status()).toBe(200);
	});

	test('small images redirect to the original', async ({ request }) => {
		fs.mkdirSync(path.join(dir, 'tiny'), { recursive: true });
		fs.copyFileSync(path.join(__dirname, '..', '..', 'inc', 'favicon.png'), path.join(dir, 'tiny', 'small.png'));
		const response = await request.get(server.url + 'inc/thumb.php?f=tiny%2Fsmall.png', { maxRedirects: 0 });
		expect(response.status()).toBe(302);
		expect(response.headers()['location']).toBe('../tiny/small.png');
	});

	for (const bad of ['../index.html', 'notes.txt', 'inc/settings.php', 'escape/secret.jpg', '.hidden/h1.jpg', '2024/../../x.jpg', 'nope.jpg', 'clip.webm']) {
		test(`refuses ${bad}`, async ({ request }) => {
			const response = await request.get(server.url + 'inc/thumb.php?f=' + encodeURIComponent(bad), { maxRedirects: 0 });
			expect(response.status()).toBe(404);
		});
	}

	test('gallery tiles use thumbnails, viewer uses originals', async ({ page }) => {
		await page.goto(server.url);
		await page.waitForSelector('.imageItem img');
		await expect(page.locator('a[href="img1.jpg"] img')).toHaveAttribute('src', /inc\/thumb\.php/);
		await page.locator('a[href="img1.jpg"]').click();
		await expect(page.locator('.fancybox__slide.is-selected img.fancybox__image')).toHaveAttribute('src', 'img1.jpg');
	});
});
