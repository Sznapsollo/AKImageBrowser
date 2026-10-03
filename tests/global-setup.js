const { buildSite, startServer, MAIN_PORT } = require('./helpers');

module.exports = async function() {
	const dir = buildSite('main');
	const server = await startServer(dir, MAIN_PORT);
	return async () => server.stop();
};
