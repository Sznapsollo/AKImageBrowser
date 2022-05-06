const ImagesViewer = { 
	name: 'imagesViewer',
	template: `
		<div class="pageContent">
			<div v-if="timeRemainingLabel" style="width: 100%;color: #666666; padding: 10px;">Refresh in: {{timeRemainingLabel}}</div>
			<div v-if="!noResults">
				<pager-component></pager-component>
			</div>
			
			<div class="articleMin" v-for="image in imagesList">
				<a class="fancybox" v-bind:title="image.name + ' ' + convertUniXDate(image.changeDate)" data-fancybox-type="image" data-fancybox-group="images" v-bind:href="url+image.name">
					<div v-bind:style="imageAreaStyle" class="imageArea">
						<div>
							<img v-bind:src="url + image.name" class="notInitiated" src1="inc/placeholder-image.png" alt="" style="width: 100%; height: auto"/>
						</div>
						<div v-if="showFileTimes && showDescriptions"style="word-wrap: break-word">{{convertUniXDate(image.changeDate)}}</div>
						<div v-if="showFileNames && showDescriptions"style="word-wrap: break-word">{{image.name}}</div>
					</div>
				</a>
			</div>
			
			<i v-if="dataLoading" class="fa fa-spinner fa-4x fa-spin marginTop10 marginBottom10"></i>
			<a id="popupOnStartLink" class="" style="display: none" title="" data-fancybox-type="image" data-fancybox-group="images_popup" href="">&nbsp;</a>

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
		let imageWidth = parseInt(getLocalStorage(settings.imagesWidthStorageName, settings.imagesWidthDefault));
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
			if(route.params.imageName) {
				$("#popupOnStartLink").attr("href", url.value + route.params.imageName);
				StartFancyBox();
				$("#popupOnStartLink").trigger("click");
				
			}
			getImages();
		}

		function initAutoRefresh()
		{
			if(timerAutoRefresh) {
				clearTimeout(timerAutoRefresh);
			}
		
			timeRemaining = autoRefreshInterval

			checkInterval(timerAutoRefresh, reloadRoute, autoRefreshInterval);
			checkInterval(timerUpdateTimeLeft, updateTimeLeft, 1);
		};

		function checkInterval(timer, fn, timeInterval) {
			if(!autoRefresh) {
				return;
			}

			new Promise(function(resolve, reject) {
				timer = setTimeout(function() {fn(); resolve()}, 1000 * timeInterval);
			}).then(function() {
				checkInterval(timer, fn, timeInterval)
			});
		}

		function getImages() {
			showFileTimes.value = getLocalStorage(settings.fileTimesStorageName, true);
			showFileNames.value = getLocalStorage(settings.fileNamesStorageName, true);
			imageWidth = parseInt(getLocalStorage(settings.imagesWidthStorageName, settings.imagesWidthDefault));
			hideDescriptionsBelow = parseInt(getLocalStorage(settings.hideDescriptionsStorageName, settings.hideDescriptionsStorageDefault));
			showDescriptions.value = (imageWidth > hideDescriptionsBelow);

			imageAreaStyle.value = {width: imageWidth + 'px'}

			dataLoading.value = true;

			let fileTypes = getLocalStorage(settings.fileTypesStorageName, settings.fileTypesDefault);

			let data = {
				receive: 'yes', 
				startIndex: route.params.startIndex, 
				itemsPerPage: route.params.itemsPerPage, 
				fileTypes: fileTypes 
			}

			imagesList.value = []
			axios.post(('./inc/images.php'), data)
				.then(function (dataResponse) {
					viewerMessage.value = null
					dataLoading.value = false;
					imagesList.value = dataResponse.data.images;
					allCount.value = dataResponse.data.allCount;

					if(!allCount.value) {
						noResults.value = true
					}

					setTimeout(function()
					{
						mittEventBus.emit('calculateImagesPaging', {allCount: allCount.value})
						StartFancyBox();
					}, 100); 
				})
				.catch(function (error) {
					dataLoading.value = false;
					viewerMessage.value = "Images read error"
					console.log('Images read error');
				}
			);
		}

		const reloadRoute = function() {
			router.go()
		}

		const updateTimeLeft = function() {
			timeRemaining--;
			timeRemainingLabel.value = secondsToHms(timeRemaining)
		}

		Vue.onMounted(function() {
			console.log('ImagesViewer mounted')

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
			url
		}
	}
}
