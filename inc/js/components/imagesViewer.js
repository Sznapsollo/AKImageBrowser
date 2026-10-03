const ImagesViewer = { 
	name: 'imagesViewer',
	template: `
		<button type="button" class="btn zoomButton zoomInButton" @click="zoomIn" id="zoomInButton">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-zoom-in" viewBox="0 0 16 16">
				<path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"></path>
				<path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"></path>
				<path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"></path>
			</svg>
		</button>
		<button type="button" class="btn zoomButton zoomOutButton" @click="zoomOut" id="zoomOutButton">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-zoom-out" viewBox="0 0 16 16">
				<path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"></path>
				<path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"></path>
				<path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"></path>
			</svg>
		</button>
		<div class="pageContent">
			<div v-if="timeRemainingLabel != null" class="refreshLabel">Refresh in: {{timeRemainingLabel}}</div>
			<div class="toolbar">
				<input type="search" class="searchInput" placeholder="Search file name" v-model="searchText" @input="onSearchInput" aria-label="Search file name">
				<select v-model="sortOrder" @change="onSortChange" aria-label="Sort order">
					<option value="dateDesc">Newest first</option>
					<option value="dateAsc">Oldest first</option>
					<option value="nameAsc">Name A-Z</option>
					<option value="nameDesc">Name Z-A</option>
				</select>
			</div>
			<div v-if="!noResults">
				<pager-component></pager-component>
			</div>
			
			<div v-if="dataLoading" class="loadingWrapper marginTop10 marginBottom10"><div class="spinner"></div></div>

			<div class="imageItem" v-for="image in imagesList">
				<a class="fancybox" v-bind:data-caption="image.name + ' ' + convertUniXDate(image.changeDate)" data-fancybox="images" v-bind:href="url + image.url">
					<div v-bind:style="imageAreaStyle" class="imageArea">
						<div>
							<img v-bind:src="url + image.url" v-bind:width="image.width" v-bind:height="image.height" loading="lazy" alt=""/>
						</div>
						<div v-if="showFileTimes && showDescriptions" class="imageText">{{convertUniXDate(image.changeDate)}}</div>
						<div v-if="showFileNames && showDescriptions" class="imageText">{{image.name}}</div>
					</div>
				</a>
			</div>
			
			<div v-if="noResults && route.query.search" class="noResults">No images match "{{route.query.search}}"</div>
			<div v-else-if="noResults" class="noResults">There are no results for given search criteria. Perhaps folder is empty or it does not contain any image types defined in options.</div>
			<div v-if="viewerMessage" class="noResults">{{viewerMessage}}</div>

			<div v-if="!noResults">
				<pager-component></pager-component>
			</div>
			
		</div>	
	`,
	setup() {
		const route = VueRouter.useRoute()
		const router = VueRouter.useRouter()

		let secondsToHms = Vue.inject('secondsToHms');
		let convertUniXDate = Vue.inject('convertUniXDate');
		let getLocalStorage = Vue.inject('getLocalStorage');
		let setLocalStorage = Vue.inject('setLocalStorage');
		let getDefaultImageWidth = Vue.inject('getDefaultImageWidth');

		const dataLoading = Vue.ref(false)
		const allCount = Vue.ref(0)
		const imagesList = Vue.ref([])
		const noResults = Vue.ref(false)
		const viewerMessage = Vue.ref(null)

		const showFileTimes = Vue.ref(true);
		const showFileNames = Vue.ref(true);
		const showDescriptions = Vue.ref(true)
		const url = Vue.ref('')
		const timeRemainingLabel = Vue.ref(null)

		let timeRemaining = null
		let imageWidth = parseInt(getLocalStorage(settings.imagesWidthStorageName, getDefaultImageWidth()));
		let hideDescriptionsBelow = parseInt(getLocalStorage(settings.hideDescriptionsStorageName, settings.hideDescriptionsStorageDefault));
		const imageAreaStyle = Vue.ref({})

		const searchText = Vue.ref(route.query.search || '')
		const sortOrder = Vue.ref(getLocalStorage(settings.sortStorageName, settings.sortDefault))
		let searchTimer = null
		let loadedRouteKey = null
		let mittEventBus = Vue.inject('mittEventBus');
		let autoRefreshInterval = null
		let autoRefresh = null

		let timerAutoRefresh = null
		
		function initializeData() {
			var getImgsCalback = function() {
				if(!route.params.imageName) {
					return
				}
				let link = Array.from(document.querySelectorAll('a[data-fancybox="images"]')).find(function(a) {
					return a.getAttribute('href') === route.params.imageName
				})
				if(link) {
					link.click()
				}
			}

			showFileTimes.value = getLocalStorage(settings.fileTimesStorageName, true);
			showFileNames.value = getLocalStorage(settings.fileNamesStorageName, true);
			imageWidth = parseInt(getLocalStorage(settings.imagesWidthStorageName, getDefaultImageWidth()));
			hideDescriptionsBelow = parseInt(getLocalStorage(settings.hideDescriptionsStorageName, settings.hideDescriptionsStorageDefault));
			showDescriptions.value = (imageWidth > hideDescriptionsBelow);

			imageAreaStyle.value = {width: imageWidth + 'px'}
			loadedRouteKey = getRouteKey()
			imagesList.value = []
			dataLoading.value = true;
			
			getImages(getImgsCalback);
		}

		function initAutoRefresh() {
			clearInterval(timerAutoRefresh)
			timerAutoRefresh = null
			timeRemainingLabel.value = null

			if(!autoRefresh || !(autoRefreshInterval > 0)) {
				return
			}

			timeRemaining = autoRefreshInterval
			timerAutoRefresh = setInterval(function() {
				timeRemaining--
				if(timeRemaining <= 0) {
					timeRemaining = autoRefreshInterval
					getImages()
				}
				timeRemainingLabel.value = secondsToHms(timeRemaining, "now")
			}, 1000)
		}

		function changeFancyBoxImage(args) {
			if(!args) {args = {};};
			let href = args.href
			
			let params = { 
				startIndex: route.params.startIndex,
				itemsPerPage: route.params.itemsPerPage
			}
			
			if(href) {
				params.imageName = href
			}
			router.push({
				name: 'images',
				params,
				query: route.query
			})
		}

		function getRouteKey() {
			if(route.name !== 'images') {
				return null
			}
			return [route.params.startIndex, route.params.itemsPerPage, route.query.search || ''].join('|')
		}

		const onSearchInput = function() {
			clearTimeout(searchTimer)
			searchTimer = setTimeout(function() {
				searchTimer = null
				let search = searchText.value.trim()
				router.replace({
					name: 'images',
					params: {startIndex: 0, itemsPerPage: route.params.itemsPerPage},
					query: search ? {search: search} : {}
				})
			}, 300)
		}

		const onSortChange = function() {
			setLocalStorage(settings.sortStorageName, sortOrder.value)
			if(parseInt(route.params.startIndex) === 0) {
				initializeData()
				return
			}
			router.push({
				name: 'images',
				params: {startIndex: 0, itemsPerPage: route.params.itemsPerPage},
				query: route.query
			})
		}

		function getImages(callback) {

			let fileTypes = getLocalStorage(settings.fileTypesStorageName, settings.fileTypesDefault);

			let data = {
				receive: 'yes', 
				startIndex: route.params.startIndex, 
				itemsPerPage: route.params.itemsPerPage, 
				fileTypes: fileTypes,
				sort: sortOrder.value,
				search: route.query.search || '',
				secretWord: sessionStorage.getItem("secretWord")
			}

			fetch('./inc/images.php', {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(data)
				})
				.then(function (response) {
					if(!response.ok) {
						throw new Error(response.status);
					}
					return response.json();
				})
				.then(function (responseData) {

					if(responseData?.status === -2) {
						let secretWord = prompt('What is the secret word?');
						if(secretWord === null) {
							sessionStorage.removeItem("secretWord");
							dataLoading.value = false;
							viewerMessage.value = "Secret word required";
							return
						}
						sessionStorage.setItem("secretWord", secretWord);
						getImages(callback);
						return
					}

					viewerMessage.value = null
					dataLoading.value = false;
					imagesList.value = responseData.images;
					allCount.value = responseData.allCount;

					noResults.value = !allCount.value;

					setTimeout(function()
					{
						mittEventBus.emit('calculateImagesPaging', {allCount: allCount.value});
						if(callback) {
							callback()
						}
					}, 100); 
				})
				.catch(function (error) {
					dataLoading.value = false;
					viewerMessage.value = "Images read error";
					console.log('Images read error');
				}
			);
		}

		// const reloadRoute = function() {
		// 	router.go()
		// }

		const zoomIn = function() {
			imageWidth += 10;
			imageAreaStyle.value = {width: imageWidth + 'px'};
			setLocalStorage(settings.imagesWidthStorageName, imageWidth);
		}

		const zoomOut = function() {
			if(imageWidth <=  50) {
				return
			}
			imageWidth -= 10;
			imageAreaStyle.value = {width: imageWidth + 'px'};
			setLocalStorage(settings.imagesWidthStorageName, imageWidth);
		}

		const handleKeyDownAction = function (args) {
			if(!args) {args = {};};
			let key = args.key
			switch (key) {
				case '=':
				case '+':
					zoomIn()
					break
				case '_':
				case '-':
					zoomOut()
					break
			}
		}

		Vue.onMounted(function() {
			console.log('ImagesViewer mounted')

			mittEventBus.on('changeFancyBoxImage', (args) => {
				changeFancyBoxImage(args);
			});

			mittEventBus.on('handleKeyDownAction', (args) => {
				handleKeyDownAction(args);
			});

			autoRefreshInterval = parseInt(getLocalStorage(settings.autoRefreshIntervalStorageName, settings.autoRefreshIntervalDefault));
			autoRefresh = getLocalStorage(settings.autoRefreshStorageName, false);

			initAutoRefresh();
			initializeData();
		})

		Vue.onUnmounted(function() {
			clearInterval(timerAutoRefresh)
		})

		Vue.watch(getRouteKey, function(routeKey) {
			if(routeKey == null || routeKey === loadedRouteKey) {
				return
			}
			if(!searchTimer) {
				searchText.value = route.query.search || ''
			}
			initializeData()
			mittEventBus.emit('rebuildPager', {});
		})

		return {
			allCount,
			convertUniXDate,
			dataLoading,
			imageAreaStyle,
			imagesList,
			viewerMessage,
			noResults,
			onSearchInput,
			onSortChange,
			route,
			searchText,
			sortOrder,
			showDescriptions,
			showFileNames,
			showFileTimes,
			timeRemainingLabel,
			url,
			zoomIn,
			zoomOut
		}
	}
}
