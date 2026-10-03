const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { api, buildSite, startServer, MAIN_URL, FIXTURES } = require('../helpers');

const names = data => data.images.map(i => i.name);

test.describe('file types', () => {
	test('lists only allowed types, never txt/php/html', async () => {
		const data = await api(MAIN_URL, { fileTypes: 'txt, php, html' });
		expect(data.allCount).toBe(0);
		const all = await api(MAIN_URL, { itemsPerPage: 1000 });
		expect(names(all)).not.toContain('notes.txt');
		expect(names(all)).not.toContain('index.html');
	});

	test('empty client list means all allowed types', async () => {
		const all = await api(MAIN_URL, { fileTypes: '', itemsPerPage: 1000 });
		expect(names(all)).toEqual(expect.arrayContaining(['img1.jpg', 'wide.png', 'IMG10.JPG']));
	});
});

test.describe('paging and sorting', () => {
	test('clamps start index and page size', async () => {
		const data = await api(MAIN_URL, { startIndex: -5, itemsPerPage: 0 });
		expect(data.images).toHaveLength(1);
	});

	test('natural name sort, both directions', async () => {
		const asc = names(await api(MAIN_URL, { sort: 'nameAsc', search: 'img1', itemsPerPage: 4 }));
		expect(asc).toEqual(['img1.jpg', 'IMG10.JPG', 'img10.jpg', 'img11.jpg']);
		const desc = names(await api(MAIN_URL, { sort: 'nameDesc', search: 'img', itemsPerPage: 1000 }));
		expect(desc.indexOf('img60.jpg')).toBeLessThan(desc.indexOf('img9.jpg'));
	});

	test('date sort, unknown sort falls back to newest first', async () => {
		const desc = await api(MAIN_URL, { sort: 'bogus', itemsPerPage: 1000 });
		const dates = desc.images.map(i => i.changeDate);
		expect(dates).toEqual([...dates].sort((a, b) => b - a));
		const asc = await api(MAIN_URL, { sort: 'dateAsc', search: 'img', itemsPerPage: 1 });
		expect(asc.images[0].name).toBe('img60.jpg');
	});
});

test.describe('search', () => {
	test('case-insensitive, unicode aware', async () => {
		expect(names(await api(MAIN_URL, { search: 'żÓŁ' }))).toEqual(['Żółw.jpg']);
		expect((await api(MAIN_URL, { search: 'zzz' })).allCount).toBe(0);
	});
});

test.describe('file names', () => {
	test('urls are encoded, also for invalid utf-8', async ({ request }) => {
		const all = await api(MAIN_URL, { itemsPerPage: 1000 });
		const byName = Object.fromEntries(all.images.map(i => [i.name, i]));
		expect(byName['a b#.jpg'].url).toBe('a%20b%23.jpg');
		for (const image of all.images.slice(0, 15)) {
			expect((await request.get(MAIN_URL + image.url)).status(), image.name).toBe(200);
		}
	});
});

test.describe('folders', () => {
	test('lists visible subfolders with preview and count', async () => {
		const root = await api(MAIN_URL, {});
		const folders = Object.fromEntries(root.folders.map(f => [f.name, f]));
		expect(Object.keys(folders)).toEqual(expect.arrayContaining(['2024', 'Żółwie']));
		expect(Object.keys(folders).length).toBeLessThanOrEqual(3);
		expect(folders['2024'].count).toBe(18);
		expect(folders['2024'].preview).toBe('2024/p1.jpg');
	});

	test('folder with an invalid utf-8 name can be opened', async () => {
		const root = await api(MAIN_URL, {});
		const bad = root.folders.find(f => f.path.includes('%FF'));
		test.skip(!bad, 'file system does not allow invalid utf-8 names');
		expect(bad.path).toBe('bad%FF%20folder');
		const inside = await api(MAIN_URL, { path: bad.path });
		expect(inside.images.map(i => i.name)).toEqual(['inside.jpg']);
		expect(inside.images[0].url).toBe('bad%FF%20folder/inside.jpg');
	});

	test('inc folder cannot be reached in any letter case', async () => {
		for (const path of ['INC', 'Inc', 'inc']) {
			expect((await api(MAIN_URL, { path })).status).toBe(-3);
		}
	});

	test('nested folder urls are encoded per segment', async () => {
		const data = await api(MAIN_URL, { path: '2024/vacation #1' });
		expect(data.images[0].url).toBe('2024/vacation%20%231/v1.jpg');
	});

	for (const bad of ['..', '../', '2024/../..', 'escape', '.hidden', 'inc', '/etc', 'nope', '2024\\..\\..', 'a\u0000b', 'inc/../2024']) {
		test(`rejects path ${JSON.stringify(bad)}`, async () => {
			expect((await api(MAIN_URL, { path: bad })).status).toBe(-3);
		});
	}
});

test.describe('settings-dependent behaviour', () => {
	let server;
	let dir;

	test.beforeAll(async () => {
		dir = buildSite('secured', { mode: 'small', settings: { secretWord: 'bimbo', deleteOlderFiles: true, deleteOlderThanDays: 14 } });
		const old = Math.floor(Date.now() / 1000) - 86400 * 30;
		fs.utimesSync(path.join(dir, 'img1.jpg'), old, old);
		fs.utimesSync(path.join(dir, 'index.html'), old, old);
		server = await startServer(dir, 8791);
	});

	test.afterAll(() => server && server.stop());

	test('secret word is required', async () => {
		expect((await api(server.url, {})).status).toBe(-2);
		expect((await api(server.url, { secretWord: 'wrong' })).status).toBe(-2);
		expect((await api(server.url, { secretWord: 123 })).status).toBe(-2);
		expect((await api(server.url, { secretWord: 'bimbo' })).allCount).toBeGreaterThan(0);
	});

	test('old-file deletion removes only allowed media', async () => {
		await api(server.url, { secretWord: 'bimbo', fileTypes: 'txt, html, jpg' });
		expect(fs.existsSync(path.join(dir, 'img1.jpg'))).toBe(false);
		expect(fs.existsSync(path.join(dir, 'notes.txt'))).toBe(true);
		expect(fs.existsSync(path.join(dir, 'index.html'))).toBe(true);
	});
});
