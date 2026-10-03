const ZOOM_LENS_PATHS = '<path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"></path><path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"></path>'
const FOLDER_PATH = '<path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a2 2 0 0 1 .342-1.31z"/>'

const ImagesViewer = {
	name: 'imagesViewer',
	template: `
		<button type="button" class="btn zoomButton zoomInButton" @pointerdown.prevent="startZoomHold(zoomIn, $event)" @pointerup="stopZoomHold" @pointerleave="stopZoomHold" @pointercancel="stopZoomHold" @contextmenu.prevent @click="onZoomClick(zoomIn, $event)" id="zoomInButton" :title="t('zoom.in')" :aria-label="t('zoom.in')">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">${ZOOM_LENS_PATHS}<path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"></path></svg>
		</button>
		<button type="button" class="btn zoomButton zoomOutButton" @pointerdown.prevent="startZoomHold(zoomOut, $event)" @pointerup="stopZoomHold" @pointerleave="stopZoomHold" @pointercancel="stopZoomHold" @contextmenu.prevent @click="onZoomClick(zoomOut, $event)" id="zoomOutButton" :title="t('zoom.out')" :aria-label="t('zoom.out')">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">${ZOOM_LENS_PATHS}<path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"></path></svg>
		</button>
		<div class="pageContent" v-bind:class="'tiles-' + prefs.tileMode">
			<div v-if="timeRemainingLabel != null" class="refreshLabel">{{ t('msg.refreshIn', {time: timeRemainingLabel}) }}</div>
			<div v-if="route.query.path || folderNotFound" class="breadcrumbs">
				<a href="#" @click.prevent="openFolder('')">{{ t('crumbs.home') }}</a>
				<template v-for="crumb in breadcrumbs">
					/ <a href="#" @click.prevent="openFolder(crumb.path)">{{crumb.name}}</a>
				</template>
			</div>
			<div class="toolbar">
				<input type="search" class="searchInput" :placeholder="t('search.placeholder')" v-model="searchText" @input="onSearchInput" @keydown.esc="clearSearch" :aria-label="t('search.label')" :title="t('search.title')">
				<select v-model="prefs.sortOrder" :aria-label="t('sort.label')">
					<option value="dateDesc">{{ t('sort.dateDesc') }}</option>
					<option value="dateAsc">{{ t('sort.dateAsc') }}</option>
					<option value="nameAsc">{{ t('sort.nameAsc') }}</option>
					<option value="nameDesc">{{ t('sort.nameDesc') }}</option>
				</select>
			</div>
			<pager-component v-if="allCount > 0" :total="allCount"></pager-component>

			<div class="tilesArea">
			<div class="tiles" @keydown="onTilesKeydown">
			<div v-if="dataLoading" class="loadingWrapper marginTop10 marginBottom10"><div class="spinner"></div></div>

			<div class="imageItem" v-for="folder in visibleFolders" :key="'folder:' + folder.path">
				<a href="#" class="folderLink" @click.prevent="openFolder(folder.path)" v-bind:title="folder.name">
					<div v-bind:style="imageAreaStyle" class="imageArea folderArea">
						<div class="thumbBox folderBox">
							<img v-if="folder.preview" v-bind:src="folder.previewThumb || url + folder.preview" loading="lazy" v-bind:alt="folder.name"/>
							<svg v-else class="folderIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">${FOLDER_PATH}</svg>
							<span v-if="folder.preview || folder.count" class="folderBadge">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">${FOLDER_PATH}</svg>
								<span v-if="folder.count">{{folder.count}}</span>
							</span>
						</div>
						<div class="imageText">{{folder.name}}</div>
					</div>
				</a>
			</div>

			<div class="imageItem" v-for="image in imagesList" :key="image.url">
				<a class="fancybox" v-bind:data-caption="getCaption(image)" v-bind:data-thumb="image.thumb || null" data-fancybox="images" v-bind:href="url + image.url" v-bind:data-type="image.type === 'video' ? 'html5video' : null" v-bind:data-format="image.format" v-bind:data-download-src="url + image.url" v-bind:title="image.name">
					<div v-bind:style="imageAreaStyle" class="imageArea">
						<div v-if="image.type === 'video'" class="thumbBox videoThumb">
							<video v-lazy-src="url + image.url + '#t=0.1'" preload="metadata" muted playsinline @loadedmetadata="image.duration = $event.target.duration" v-bind:aria-label="image.name"></video>
							<span class="playIcon"></span>
							<span v-if="image.duration" class="durationBadge">{{formatDuration(image.duration)}}</span>
						</div>
						<div v-else class="thumbBox">
							<img v-bind:src="image.thumb || url + image.url" v-bind:width="image.width" v-bind:height="image.height" loading="lazy" v-bind:alt="image.name"/>
						</div>
						<div v-if="prefs.showFileTimes && showDescriptions" class="imageText">{{convertUniXDate(image.changeDate)}}</div>
						<div v-if="prefs.showFileNames && showDescriptions" class="imageText">{{image.name}}</div>
					</div>
				</a>
			</div>

			<div v-if="noResults && route.query.search" class="noResults">{{ t('msg.noMatch', {search: route.query.search}) }}</div>
			<div v-else-if="noResults" class="noResults">{{ t('msg.empty') }}</div>
			<div v-if="viewerMessage" class="noResults">{{ t(viewerMessage) }}</div>
			</div>
			</div>

			<pager-component v-if="allCount > 0" :total="allCount" :show-per-page="false"></pager-component>
		</div>
	`,
	setup() {
		const route = VueRouter.useRoute()
		const router = VueRouter.useRouter()

		let secondsToHms = Vue.inject('secondsToHms');
		let convertUniXDate = Vue.inject('convertUniXDate');
		let mittEventBus = Vue.inject('mittEventBus');
		let prefs = Vue.inject('prefs');

		const dataLoading = Vue.ref(false)
		const allCount = Vue.ref(0)
		const imagesList = Vue.ref([])
		const foldersList = Vue.ref([])
		const noResults = Vue.ref(false)
		const viewerMessage = Vue.ref(null)
		const folderNotFound = Vue.ref(false)
		const url = Vue.ref('')
		const timeRemainingLabel = Vue.ref(null)
		const searchText = Vue.ref(route.query.search || '')

		let timeRemaining = null
		let timerAutoRefresh = null
		let searchTimer = null
		let fileTypesTimer = null
		let zoomHoldTimer = null
		let loadedRouteKey = null
		let loadedVersion = null

		const showDescriptions = Vue.computed(function() {
			return prefs.imageWidth > prefs.hideDescriptionsBelow
		})

		const imageAreaStyle = Vue.computed(function() {
			return {width: prefs.imageWidth + 'px'}
		})

		const visibleFolders = Vue.computed(function() {
			return parseInt(route.params.startIndex) > 0 ? [] : foldersList.value
		})

		const breadcrumbs = Vue.computed(function() {
			let crumbs = []
			let path = ''
			String(route.query.path || '').split('/').filter(Boolean).forEach(function(name) {
				path = path ? path + '/' + name : name
				crumbs.push({name: name, path: path})
			})
			return crumbs
		})

		function getRouteKey() {
			if(route.name !== 'images') {
				return null
			}
			return getPageKey(route)
		}

		function openDeepLinkedImage() {
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

		function initializeData() {
			loadedRouteKey = getRouteKey()
			loadedVersion = null
			imagesList.value = []
			foldersList.value = []
			dataLoading.value = true
			getImages(openDeepLinkedImage)
		}

		function initAutoRefresh() {
			clearInterval(timerAutoRefresh)
			timerAutoRefresh = null
			timeRemainingLabel.value = null

			if(!prefs.autoRefresh || !(prefs.autoRefreshInterval > 0)) {
				return
			}

			timeRemaining = prefs.autoRefreshInterval
			timerAutoRefresh = setInterval(function() {
				timeRemaining--
				if(timeRemaining <= 0) {
					timeRemaining = prefs.autoRefreshInterval
					getImages(null, true)
				}
				timeRemainingLabel.value = secondsToHms(timeRemaining, t('time.now'))
			}, 1000)
		}

		function changeFancyBoxImage(args) {
			let params = {
				startIndex: route.params.startIndex,
				itemsPerPage: route.params.itemsPerPage
			}
			if(args && args.href) {
				params.imageName = args.href
			}
			router.push({name: 'images', params, query: route.query})
		}

		const onSearchInput = function() {
			clearTimeout(searchTimer)
			searchTimer = setTimeout(function() {
				searchTimer = null
				let search = searchText.value.trim()
				router.replace({
					name: 'images',
					params: {startIndex: 0, itemsPerPage: route.params.itemsPerPage},
					query: Object.assign({}, route.query.path ? {path: route.query.path} : {}, search ? {search: search} : {})
				})
			}, 300)
		}

		const openFolder = function(path) {
			router.push({
				name: 'images',
				params: {startIndex: 0, itemsPerPage: route.params.itemsPerPage},
				query: path ? {path: path} : {}
			})
		}

		function reloadFromFirstPage() {
			if(route.name !== 'images') {
				return
			}
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

		function getImages(callback, isRefresh) {
			let data = {
				receive: 'yes',
				startIndex: route.params.startIndex,
				itemsPerPage: route.params.itemsPerPage,
				fileTypes: prefs.fileTypes,
				sort: prefs.sortOrder,
				search: route.query.search || '',
				path: route.query.path || '',
				knownVersion: isRefresh ? loadedVersion : null,
				secretWord: sessionStorage.getItem("secretWord")
			}
			let requestKey = loadedRouteKey

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
					if(requestKey !== loadedRouteKey) {
						return
					}
					if(responseData?.status === 0) {
						return
					}

					if(responseData?.status === -2) {
						let secretWord = prompt(t('msg.secretPrompt'));
						if(secretWord === null) {
							sessionStorage.removeItem("secretWord");
							dataLoading.value = false;
							viewerMessage.value = 'msg.secretRequired';
							return
						}
						sessionStorage.setItem("secretWord", secretWord);
						getImages(callback);
						return
					}

					dataLoading.value = false;
					folderNotFound.value = responseData?.status === -3;
					if(folderNotFound.value) {
						viewerMessage.value = 'msg.folderNotFound';
						imagesList.value = [];
						foldersList.value = [];
						allCount.value = 0;
						noResults.value = false;
						return
					}

					viewerMessage.value = null
					loadedVersion = responseData.version
					imagesList.value = responseData.images;
					foldersList.value = responseData.folders || [];
					allCount.value = responseData.allCount;
					noResults.value = !allCount.value && !foldersList.value.length;

					Vue.nextTick(function() {
						renderedPageKey = requestKey
						mittEventBus.emit('imagesRendered', requestKey)
						if(callback) {
							callback()
						}
					})
				})
				.catch(function (error) {
					dataLoading.value = false;
					viewerMessage.value = 'msg.readError';
					console.log('Images read error', error);
				}
			);
		}

		const startZoomHold = function(zoom, event) {
			if(event.button !== 0) {
				return
			}
			stopZoomHold()
			zoom()
			zoomHoldTimer = setTimeout(function repeat() {
				zoom()
				zoomHoldTimer = setTimeout(repeat, 50)
			}, 400)
		}

		const stopZoomHold = function() {
			clearTimeout(zoomHoldTimer)
			zoomHoldTimer = null
		}

		const onZoomClick = function(zoom, event) {
			if(event.detail === 0) {
				zoom()
			}
		}

		const zoomIn = function() {
			let inner = document.querySelector('#middleSection .inner')
			if(inner && prefs.imageWidth + 10 > inner.clientWidth - 30) {
				return
			}
			prefs.imageWidth += 10
		}

		const zoomOut = function() {
			if(prefs.imageWidth <= 50) {
				return
			}
			prefs.imageWidth -= 10
		}

		const focusSearch = function() {
			let input = document.querySelector('.searchInput')
			if(input && input.offsetParent) {
				input.focus()
				input.select()
			}
		}

		const clearSearch = function(e) {
			if(!searchText.value) {
				e.target.blur()
				return
			}
			searchText.value = ''
			onSearchInput()
		}

		const findTileInNextRow = function(links, link, direction) {
			let rect = link.getBoundingClientRect()
			let center = rect.left + rect.width / 2
			let best = null
			let bestScore = Infinity
			links.forEach(function(other) {
				let otherRect = other.getBoundingClientRect()
				let rowDistance = (otherRect.top - rect.top) * direction
				if(rowDistance <= 5) {
					return
				}
				let score = rowDistance * 1000 + Math.abs(otherRect.left + otherRect.width / 2 - center)
				if(score < bestScore) {
					best = other
					bestScore = score
				}
			})
			return best
		}

		const onTilesKeydown = function(e) {
			let link = e.target.closest && e.target.closest('.imageItem > a')
			if(!link || e.altKey || e.ctrlKey || e.metaKey) {
				return
			}
			let links = Array.from(document.querySelectorAll('.tiles .imageItem > a'))
			let index = links.indexOf(link)
			let target = null
			switch(e.key) {
				case 'ArrowRight':
					target = links[index + 1]
					break
				case 'ArrowLeft':
					target = links[index - 1]
					break
				case 'ArrowDown':
					target = findTileInNextRow(links, link, 1)
					break
				case 'ArrowUp':
					target = findTileInNextRow(links, link, -1)
					break
				case 'Home':
					target = links[0]
					break
				case 'End':
					target = links[links.length - 1]
					break
				default:
					return
			}
			e.preventDefault()
			if(target) {
				target.focus()
				target.scrollIntoView({block: 'nearest'})
			}
		}

		const formatFileSize = function(bytes) {
			if(!(bytes > 0)) {
				return ''
			}
			let units = ['B', 'KB', 'MB', 'GB']
			let i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
			return (bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + units[i]
		}

		const formatDuration = function(seconds) {
			seconds = Math.round(seconds)
			let h = Math.floor(seconds / 3600)
			let m = Math.floor(seconds % 3600 / 60)
			let s = String(seconds % 60).padStart(2, '0')
			return h ? h + ':' + String(m).padStart(2, '0') + ':' + s : m + ':' + s
		}

		const getCaption = function(image) {
			let info = []
			if(image.width && image.height) {
				info.push(image.width + '×' + image.height)
			}
			if(image.fileSize) {
				info.push(formatFileSize(image.fileSize))
			}
			return image.name + ' ' + convertUniXDate(image.changeDate) + (info.length ? ' · ' + info.join(' · ') : '')
		}

		const handleKeyDownAction = function(args) {
			switch(args && args.key) {
				case '=':
				case '+':
					zoomIn()
					break
				case '_':
				case '-':
					zoomOut()
					break
				case '/':
					focusSearch()
					break
			}
		}

		Vue.onMounted(function() {
			mittEventBus.on('changeFancyBoxImage', changeFancyBoxImage)
			mittEventBus.on('handleKeyDownAction', handleKeyDownAction)
			initAutoRefresh()
			initializeData()
		})

		Vue.onUnmounted(function() {
			mittEventBus.off('changeFancyBoxImage', changeFancyBoxImage)
			mittEventBus.off('handleKeyDownAction', handleKeyDownAction)
			stopZoomHold()
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
		})

		Vue.watch(function() { return prefs.sortOrder }, reloadFromFirstPage)

		Vue.watch(function() { return prefs.fileTypes }, function() {
			clearTimeout(fileTypesTimer)
			fileTypesTimer = setTimeout(reloadFromFirstPage, 600)
		})

		Vue.watch(function() { return [prefs.autoRefresh, prefs.autoRefreshInterval] }, initAutoRefresh)

		return {
			allCount,
			breadcrumbs,
			clearSearch,
			convertUniXDate,
			dataLoading,
			folderNotFound,
			formatDuration,
			getCaption,
			imageAreaStyle,
			imagesList,
			noResults,
			onSearchInput,
			onTilesKeydown,
			onZoomClick,
			openFolder,
			prefs,
			route,
			searchText,
			showDescriptions,
			startZoomHold,
			stopZoomHold,
			timeRemainingLabel,
			url,
			viewerMessage,
			visibleFolders,
			zoomIn,
			zoomOut
		}
	}
}
