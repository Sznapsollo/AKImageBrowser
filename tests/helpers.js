const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PROJECTS = ['chromium', 'firefox', 'webkit'];

function currentProject() {
	try {
		return require('@playwright/test').test.info().project.name;
	} catch (e) {
		return null;
	}
}
const FIXTURES = path.join(__dirname, '.fixtures');

function buildSite(name, { mode = 'full', settings = {} } = {}) {
	const project = currentProject();
	const dir = path.join(FIXTURES, project ? `${name}-${project}` : name);
	fs.rmSync(dir, { recursive: true, force: true });
	fs.rmSync(dir + '-outside', { recursive: true, force: true });
	fs.mkdirSync(dir, { recursive: true });
	fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(dir, 'index.html'));
	fs.cpSync(path.join(ROOT, 'inc'), path.join(dir, 'inc'), { recursive: true });
	execFileSync('php', [path.join(__dirname, 'make-fixture.php'), dir, mode], { stdio: 'inherit' });
	const lines = Object.entries(settings).map(([key, value]) => `\n$settings->${key} = ${JSON.stringify(value)};`);
	fs.appendFileSync(path.join(dir, 'inc', 'settings.php'), lines.join(''));
	return dir;
}

async function startServer(dir, port) {
	port += Math.max(0, PROJECTS.indexOf(currentProject())) * 20;
	const env = Object.assign({}, process.env, { PHP_CLI_SERVER_WORKERS: '4' });
	const server = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', dir], { stdio: 'ignore', env });
	const url = `http://127.0.0.1:${port}/`;
	for (let i = 0; i < 50; i++) {
		try {
			await fetch(url);
			return { url, stop: () => server.kill() };
		} catch (e) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
	}
	server.kill();
	throw new Error('php server did not start on ' + url);
}

async function api(baseUrl, body) {
	const response = await fetch(baseUrl + 'inc/images.php', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(Object.assign({ receive: 1 }, body)),
	});
	return response.json();
}

const MAIN_PORT = Number(process.env.AKIB_PORT || 8790);
const MAIN_URL = `http://127.0.0.1:${MAIN_PORT}/`;

function trackPageErrors(page) {
	const errors = [];
	page.on('pageerror', e => errors.push(e.message));
	page.on('console', m => {
		if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) {
			errors.push(m.text());
		}
	});
	page.on('response', r => {
		if (r.status() >= 400) {
			errors.push(`${r.status()} ${r.url()}`);
		}
	});
	return errors;
}

module.exports = { trackPageErrors, buildSite, startServer, api, FIXTURES, MAIN_PORT, MAIN_URL };
