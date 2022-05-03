

const routes = [
	{ path: '/images/:startIndex/:itemsPerPage/:imageName?', name: 'images', component: ImagesViewer, props: true },
	{ path: '/about', name: 'about', component: AboutComponent },
	{ path: '/', name: 'home', component: HomeComponent }
];

const router = VueRouter.createRouter({
	// history: VueRouter.createWebHistory(),
	history: VueRouter.createWebHashHistory(),
	routes,
});

app.use(router)


	