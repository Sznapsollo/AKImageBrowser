const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { FIXTURES } = require('../helpers');

const hasVideos = fs.existsSync(path.join(FIXTURES, 'main', 'clip.webm'));

test.describe('video', () => {
	test.skip(!hasVideos, 'ffmpeg not available, no fixture videos');

	test('video tiles have a play icon and play in the viewer', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.videoThumb .playIcon')).toHaveCount(2);
		await page.locator('a[href="clip.webm"]').click();
		const video = page.locator('.fancybox__slide.is-selected video');
		await expect(video).toBeVisible();
		await expect.poll(() => video.evaluate(v => v.currentTime)).toBeGreaterThan(0);
		expect(await video.evaluate(v => v.error)).toBeNull();
	});

	test('mp4 plays (needs a browser with H.264, e.g. PW_CHANNEL=chrome)', async ({ page, browserName }) => {
		test.skip(browserName !== 'chromium' || !process.env.PW_CHANNEL, 'only Google Chrome is guaranteed to have H.264');
		await page.goto('/');
		await page.locator('a[href="clip.mp4"]').click();
		const video = page.locator('.fancybox__slide.is-selected video');
		await expect.poll(() => video.evaluate(v => v.currentTime)).toBeGreaterThan(0);
	});
});

test.describe('viewer toolbar', () => {
	test('has slideshow, fullscreen and download for the current file', async ({ page }) => {
		await page.goto('/');
		await page.locator('a[href="wide.png"]').click();
		const toolbar = page.locator('.fancybox__toolbar');
		await expect(toolbar.locator('[title="Toggle slideshow"]')).toBeVisible();
		await expect(toolbar.locator('[title="Toggle full-screen mode"]')).toBeVisible();
		await expect(toolbar.locator('a.fancybox__button--download')).toHaveAttribute('href', 'wide.png');
	});
});
