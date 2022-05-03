app.component('pager-component' , { 
	name: 'pagerComponent',
	template: `
	<div class="pagerArea">
		<div>
			<span class="choosePageArea">Per page: 
				<select v-model="selectedItemsPerPage" v-on:change="updateItemsPerPage()">
					<option v-for="item in itemsPerPageArray">
						{{ item }}
					</option>
				</select>
			</span>		
			<span class="choosePageArea">Page: 
				<select v-model="selectedPage" v-on:change="updateSelectedPage()">
					<option v-for="page in pages" v-bind:value="page">
						{{ parseInt(page) + 1 }}
					</option>
				</select>
			</span>
			<span class="choosePageArea">All: 
				{{totalItems}}
			</span>
		</div>
		<div class="pagerButtons">
			<a style="cursor: pointer;" v-if="canGoBack()" @click="goToPage('first')"><<</a>
			<a style="cursor: pointer;" v-if="canGoBack()" @click="goToPage('previous')"><</a>
			<a style="cursor: pointer;" v-if="canGoNext()" @click="goToPage('next')">></a>
			<a style="cursor: pointer;" v-if="canGoNext()" @click="goToPage('last')">>></a>
		</div>
	</div>	
	`,
	setup() {
		const route = VueRouter.useRoute()
		const router = VueRouter.useRouter()

		let mittEventBus = Vue.inject('mittEventBus');
		let getLocalStorage = Vue.inject('getLocalStorage');
		let setLocalStorage = Vue.inject('setLocalStorage');

		const pages = Vue.ref([]);
		const itemsPerPageArray = Vue.ref([12,24,48,96,192,384,768]);
		const selectedPage = Vue.ref(0);
		const selectedItemsPerPage =  Vue.ref(parseInt(getLocalStorage(settings.itemsPerPageStorageName, settings.itemsPerPageDefault)));
		const totalItems = Vue.ref(0)

		const goToPage = function(mode) {
			let itemsPerPage = parseInt(route.params.itemsPerPage, 0);
			switch (mode) {
				case 'first':
					router.push({ name: 'images', params: {startIndex: firstNode, itemsPerPage: itemsPerPage} })
					break;
				case 'previous':
					router.push({ name: 'images', params: {startIndex: previousNode, itemsPerPage: itemsPerPage} })
					break;
				case 'next':
					router.push({ name: 'images', params: {startIndex: nextNode, itemsPerPage: itemsPerPage} })
					break;
				case 'last':
					router.push({ name: 'images', params: {startIndex: lastNode, itemsPerPage: itemsPerPage} })
					break;
			}
		}

		const updateItemsPerPage = function() 
		{
			setLocalStorage("itemsPerPage", selectedItemsPerPage.value);
			router.push({ name: 'images', params: {startIndex: 0, itemsPerPage: getLocalStorage(settings.itemsPerPageStorageName, settings.itemsPerPageDefault)} })
		}
		
		const updateSelectedPage = function() 
		{
			router.push({ name: 'images', params: {startIndex: selectedPage.value * route.params.itemsPerPage, itemsPerPage: getLocalStorage(settings.itemsPerPageStorageName, settings.itemsPerPageDefault)} })
		}
	
		const canGoBack = function()
		{
			return parseInt(route.params.startIndex, 0) > 0;
		}

		const canGoNext = function()
		{
			return parseInt(route.params.startIndex, 0) + parseInt(route.params.itemsPerPage, 0) < parseInt(totalItems.value, 0);
		}

		let firstNode = 0
		let previousNode = 0
		let nextNode = 0
		let lastNode = 0

		const rebuildPager = function() {
			let startIndex = parseInt(route.params.startIndex, 0);
			let itemsPerPage = parseInt(route.params.itemsPerPage, 0);
			
			selectedItemsPerPage.value = itemsPerPage;

			if(itemsPerPage <= 0) {
				itemsPerPage = parseInt(getLocalStorage(settings.itemsPerPageStorageName, settings.itemsPerPageDefault));
			}
			
			selectedPage.value = startIndex / itemsPerPage;
			var pagesNumber = totalItems.value / itemsPerPage;
			pages.value = [];
			for (var i = 0; i < pagesNumber; i++) { 
				if(!pages.value.includes(i))
					pages.value.push(i);
			}
			
			if(startIndex > 0) {
				if(startIndex - itemsPerPage > 0) {
					previousNode = startIndex - itemsPerPage;
				} else {
					previousNode = 0;
				} 
			}	
			
			if(startIndex + itemsPerPage < totalItems.value) {
				nextNode = startIndex + itemsPerPage;
				
				lastNode = totalItems.value - itemsPerPage;
				var itemsRound = parseInt(getLocalStorage(settings.itemsPerPageStorageName, settings.itemsPerPageDefault) + 2);
				
				for(var i=0; i<=itemsRound; i++)
				{
					var calculate = totalItems.value - itemsPerPage + i;
					if(calculate % parseInt(getLocalStorage(settings.itemsPerPageStorageName, settings.itemsPerPageDefault)) == 0)
					{
						lastNode = calculate;
						break;
					}
				}
			}
		}

		Vue.onMounted(function() {
			console.log('PagerComponent mounted')

			mittEventBus.on('calculateImagesPaging', (args) => {
				if(!args) {
					args = {};
				}
				let allCount = args.allCount || 0
				totalItems.value = parseInt(allCount, 0);
				rebuildPager()
			});
			mittEventBus.on('rebuildPager', (args) => {
				rebuildPager()
			});
		})

		return {
			canGoBack,
			canGoNext,
			goToPage,
			itemsPerPageArray,
			pages,
			selectedItemsPerPage,
			selectedPage,
			totalItems,
			updateItemsPerPage,
			updateSelectedPage
		}
	}
})
