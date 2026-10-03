

const routes = [
	{ path: '/images/:startIndex/:itemsPerPage/:imageName?', name: 'images', component: ImagesViewer, props: true },
	{ path: '/about', name: 'about', component: AboutComponent },
	{ path: '/', name: 'home', component: HomeComponent }
];

const waitForRenderedPage = function(key) {
	return new Promise(function(resolve) {
		if(renderedPageKey === key) {
			Vue.nextTick(resolve)
			return
		}
		let done = function(renderedKey) {
			if(renderedKey !== undefined && renderedKey !== key) {
				return
			}
			mittEventBus.off('imagesRendered', done)
			clearTimeout(timer)
			resolve()
		}
		let timer = setTimeout(done, 3000)
		mittEventBus.on('imagesRendered', done)
	})
}

const router = VueRouter.createRouter({
	history: VueRouter.createWebHashHistory(),
	routes,
	scrollBehavior(to, from, savedPosition) {
		if(getPageKey(to) === getPageKey(from)) {
			return false
		}
		if(!savedPosition) {
			return {top: 0}
		}
		if(to.name !== 'images') {
			return savedPosition
		}
		return waitForRenderedPage(getPageKey(to)).then(function() {
			return savedPosition
		})
	}
});

app.use(router)


	