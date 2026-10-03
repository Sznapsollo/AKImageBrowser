const { test, expect } = require('@playwright/test');

const open = async (page, hash = '') => {
	await page.goto('/' + hash);
	await page.waitForSelector('.imageItem');
};

const allCount = page => page.locator('.pagerCount').first();

test.describe('search and sort', () => {
	test('search filters on the server and lives in the url', async ({ page }) => {
		await open(page);
		await page.locator('.searchInput').fill('img1');
		await expect(page).toHaveURL(/\?search=img1$/);
		await expect(allCount(page)).toHaveText('12 items');
		await page.reload();
		await expect(page.locator('.searchInput')).toHaveValue('img1');
		await expect(allCount(page)).toHaveText('12 items');
	});

	test('no match message keeps the toolbar, clearing restores all', async ({ page }) => {
		await open(page);
		await page.locator('.searchInput').fill('zzz');
		await expect(page.locator('.noResults')).toContainText('No images match "zzz"');
		await expect(page.locator('.toolbar')).toBeVisible();
		await page.locator('.searchInput').fill('');
		await expect(page).toHaveURL(/#\/images\/0\/48$/);
	});

	test('sort is remembered', async ({ page }) => {
		await open(page);
		await page.locator('.toolbar select').selectOption('nameAsc');
		await expect(page.locator('.imageItem a.fancybox').first()).toHaveAttribute('title', '<img src=x onerror=alert(1)>.jpg');
		await page.reload();
		await expect(page.locator('.toolbar select')).toHaveValue('nameAsc');
	});

	test('search survives paging and opening an image', async ({ page }) => {
		await open(page, '#/images/0/12?search=img');
		await page.locator('.pageButton[aria-label="Next page"]').first().click();
		await expect(page).toHaveURL(/\/images\/12\/12\?search=img$/);
		await page.locator('.imageItem a.fancybox').first().click();
		await expect(page).toHaveURL(/\/images\/12\/12\/.+\?search=img$/);
	});
});

test.describe('folders', () => {
	test('browse into folders and back with breadcrumbs', async ({ page }) => {
		await open(page);
		await page.locator('.folderArea', { hasText: '2024' }).click();
		await expect(page).toHaveURL(/\?path=2024$/);
		await expect(page.locator('.breadcrumbs')).toHaveText(/Home\s*\/\s*2024/);
		await page.locator('.folderArea', { hasText: 'vacation #1' }).click();
		await expect(page.locator('.imageItem a.fancybox')).toHaveCount(3);
		await page.locator('.breadcrumbs a', { hasText: '2024' }).click();
		await expect(page).toHaveURL(/\?path=2024$/);
		await page.locator('.breadcrumbs a', { hasText: 'Home' }).click();
		await expect(page).toHaveURL(/#\/images\/0\/48$/);
	});

	test('page size and paging work inside a folder after navigating there', async ({ page }) => {
		await open(page);
		await page.locator('.folderArea', { hasText: '2024' }).click();
		await expect(page.locator('.imageItem a.fancybox')).toHaveCount(18);
		await page.locator('.perPage select').selectOption('12');
		await expect(page.locator('.imageItem a.fancybox')).toHaveCount(12);
		await page.locator('.pageButton[aria-label="Next page"]').first().click();
		await expect(page.locator('.imageItem a.fancybox')).toHaveCount(6);
		await expect(page.locator('.folderArea')).toHaveCount(0);
	});

	test('folder tiles show preview and count', async ({ page }) => {
		await open(page);
		const tile = page.locator('.folderArea', { hasText: '2024' });
		await expect(tile.locator('img')).toHaveAttribute('src', /2024(\/|%2F)p1\.jpg/);
		await expect(tile.locator('.folderBadge')).toContainText('18');
	});

	test('path outside the gallery shows folder not found', async ({ page }) => {
		await page.goto('/#/images/0/48?path=..%2F..');
		await expect(page.locator('.noResults')).toContainText('Folder not found');
	});

	test('title click resets folder and search', async ({ page }) => {
		await open(page, '#/images/0/48?path=2024&search=p1');
		await page.locator('.navbar-brand').click();
		await expect(page).toHaveURL(/#\/images\/0\/48$/);
		await expect(page.locator('.searchInput')).toHaveValue('');
	});
});
