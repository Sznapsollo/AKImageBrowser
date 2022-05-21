const ImagesViewer = { 
	name: 'imagesViewer',
	template: `
		<button type="button" class="btn btn-secondary zoomInButton" @click="zoomIn" id="zoomInButton">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-zoom-in" viewBox="0 0 16 16">
				<path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"></path>
				<path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"></path>
				<path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"></path>
			</svg>
		</button>
		<button type="button" class="btn btn-secondary zoomOutButton" @click="zoomOut" id="zoomOutButton">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-zoom-out" viewBox="0 0 16 16">
				<path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"></path>
				<path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"></path>
				<path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"></path>
			</svg>
		</button>
		<div class="pageContent">
			<div v-if="timeRemainingLabel != null" style="top: 10px;position: fixed;left: 50%;margin-left: -150px;width: 300px; border-radius: 10px;background-color:#ffffff80;z-index: 9999;color: #666666; padding: 10px;">Refresh in: {{timeRemainingLabel}}</div>
			<div v-if="!noResults">
				<pager-component></pager-component>
			</div>
			
			<div v-if="dataLoading" class="loadingWrapper marginTop10 marginBottom10"><img src="inc/imgs/spinner.gif" style="width: 30px;"/></div>

			<div class="imageItem" v-for="image in imagesList">
				<a class="fancybox" v-bind:data-caption="image.name + ' ' + convertUniXDate(image.changeDate)" data-fancybox="images" v-bind:href="url+image.name">
					<div v-bind:style="imageAreaStyle" class="imageArea">
						<div>
							<img v-bind:data-src="url + image.name" class="notInitiated" class="lazyload" src="inc/imgs/placeholder-image.png" alt="" style="width: 100%; height: auto"/>
						</div>
						<div v-if="showFileTimes && showDescriptions"style="word-wrap: break-word">{{convertUniXDate(image.changeDate)}}</div>
						<div v-if="showFileNames && showDescriptions"style="word-wrap: break-word">{{image.name}}</div>
					</div>
				</a>
			</div>
			
			<div v-if="noResults" class="noResults">There are no results for given search criteria. Perhaps folder is empty or it does not contain any image types defined in options.</div>
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

		// const startIndex = Vue.ref(route.params.startIndex)
		// const itemsPerPage = Vue.ref(route.params.itemsPerPage)
		// const imageName = Vue.ref(route.params.imageName)
		let mittEventBus = Vue.inject('mittEventBus');
		let autoRefreshInterval = null
		let autoRefresh = null

		let timerAutoRefresh
		let timerUpdateTimeLeft
		
		function initializeData() {
			var getImgsCalback = function() {
				if(route.params.imageName) {
					$('a[href$="'+(url.value + route.params.imageName)+'"]')[0].click()
				}
			}

			showFileTimes.value = getLocalStorage(settings.fileTimesStorageName, true);
			showFileNames.value = getLocalStorage(settings.fileNamesStorageName, true);
			imageWidth = parseInt(getLocalStorage(settings.imagesWidthStorageName, getDefaultImageWidth()));
			hideDescriptionsBelow = parseInt(getLocalStorage(settings.hideDescriptionsStorageName, settings.hideDescriptionsStorageDefault));
			showDescriptions.value = (imageWidth > hideDescriptionsBelow);

			imageAreaStyle.value = {width: imageWidth + 'px'}
			imagesList.value = []
			dataLoading.value = true;
			
			getImages(getImgsCalback);
		}

		function initAutoRefresh()
		{
			if(timerAutoRefresh) {
				clearTimeout(timerAutoRefresh);
			}
		
			timeRemaining = autoRefreshInterval

			checkInterval(timerAutoRefresh, function() { getImages(); timeRemaining = autoRefreshInterval; }, autoRefreshInterval);
			checkInterval(timerUpdateTimeLeft, updateTimeLeft, 1);
		};

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
				params
			})
		}

		function checkInterval(timer, fn, timeInterval) {
			if(!autoRefresh) {
				return;
			}

			new Promise(function(resolve, reject) {
				timer = setTimeout(function() {fn(); resolve()}, 1000 * timeInterval);
			}).then(function() {
				checkInterval(timer, fn, timeInterval);
			});
		}

		function getImages(callback) {

			let fileTypes = getLocalStorage(settings.fileTypesStorageName, settings.fileTypesDefault);

			let data = {
				receive: 'yes', 
				startIndex: route.params.startIndex, 
				itemsPerPage: route.params.itemsPerPage, 
				fileTypes: fileTypes 
			}

			axios.post(('./inc/images.php'), data)
				.then(function (dataResponse) {
					viewerMessage.value = null
					dataLoading.value = false;
					imagesList.value = dataResponse.data.images;
					allCount.value = dataResponse.data.allCount;

					if(!allCount.value) {
						noResults.value = true;
					}

					setTimeout(function()
					{
						mittEventBus.emit('calculateImagesPaging', {allCount: allCount.value});
						StartFancyBox();
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

		const updateTimeLeft = function() {
			timeRemaining--;
			timeRemainingLabel.value = secondsToHms(timeRemaining, "now")
		}

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
			if(!args) {ags = {};};
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

		// Vue.onUnmounted(function() {
		// 	console.log('ImagesViewer unmounted')

		// 	if(timerAutoRefresh) {
		// 		clearTimeout(timerAutoRefresh);
		// 	}
		// })

		Vue.watch(
			() => route.params.itemsPerPage,
			async itemsPerPageParam => {
				if(itemsPerPageParam == null) {
					return
				}
				console.log('itemsPerPage changed', itemsPerPageParam)
				initializeData()
				mittEventBus.emit('rebuildPager', {});
			}
		)

		Vue.watch(
			() => route.params.startIndex,
			async startIndexParam => {
				if(startIndexParam == null) {
					return
				}
				console.log('startIndex changed', startIndexParam)
				initializeData()
				mittEventBus.emit('rebuildPager', {});
			}
		)

		return {
			allCount,
			convertUniXDate,
			dataLoading,
			imageAreaStyle,
			imagesList,
			viewerMessage,
			noResults,
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
