const HomeComponent = { 
	name: 'homeComponent',
	template: `
		<br><br>
		{{componentName}}
	`,
	setup() {
		const route = VueRouter.useRoute()
		const router = VueRouter.useRouter()

		const componentName = Vue.ref('Home Component')
		let getLocalStorage = Vue.inject('getLocalStorage');
		
		Vue.onMounted(function() {
			console.log('HomeComponent mounted')

			// redirect
			// get defaul values from settings and cached data
			router.push({ name: 'images', params: {startIndex: 0, itemsPerPage: getLocalStorage(settings.itemsPerPageStorageName, settings.itemsPerPageDefault)} })
		})

		return {
			componentName
		}
	}
}
