const getLocalStorage = function(index, defaultValue) {
	try {
		if(typeof localStorage === 'undefined' || localStorage[index] == undefined) {
			return defaultValue
		}
		if(typeof defaultValue === 'boolean') {
			return JSON.parse(localStorage[index])
		}
		if(typeof defaultValue === 'number') {
			let value = parseInt(localStorage[index])
			return isNaN(value) ? defaultValue : value
		}
		return localStorage[index]
	} catch(e) {
		return defaultValue
	}
}

const setLocalStorage = function(name, value) {
	try {
		if(typeof localStorage !== 'undefined') {
			localStorage[name] = value
		}
	} catch(e) {}
}

const getDefaultImageWidth = function() {
	if(window.innerWidth && window.innerWidth <= 500) {
		return window.innerWidth - 60
	}
	return settings.imagesWidthDefault || 200
}

let renderedPageKey = null

const getPageKey = function(route) {
	return [route.name, route.params.startIndex, route.params.itemsPerPage, route.query.path || '', route.query.search || ''].join('|')
}

const prefStorage = {
	imageWidth: [settings.imagesWidthStorageName, getDefaultImageWidth()],
	showFileTimes: [settings.fileTimesStorageName, true],
	showFileNames: [settings.fileNamesStorageName, true],
	hideDescriptionsBelow: [settings.hideDescriptionsStorageName, settings.hideDescriptionsStorageDefault],
	autoRefresh: [settings.autoRefreshStorageName, false],
	autoRefreshInterval: [settings.autoRefreshIntervalStorageName, settings.autoRefreshIntervalDefault],
	fileTypes: [settings.fileTypesStorageName, settings.fileTypesDefault],
	tileMode: [settings.tileModeStorageName, settings.tileModeDefault],
	sortOrder: [settings.sortStorageName, settings.sortDefault],
	theme: [settings.themeStorageName, settings.themeDefault],
	language: [settings.languageStorageName, settings.languageDefault]
}

const prefs = Vue.reactive({})
Object.keys(prefStorage).forEach(function(key) {
	prefs[key] = getLocalStorage(prefStorage[key][0], prefStorage[key][1])
	Vue.watch(function() { return prefs[key] }, function(value) {
		setLocalStorage(prefStorage[key][0], value)
	})
})

const currentLanguage = Vue.computed(function() {
	return resolveLanguage(prefs.language)
})

const t = function(key, params, count) {
	return translate(currentLanguage.value, key, params, count)
}

const applyTheme = function(value) {
	if(value === 'light' || value === 'dark') {
		document.documentElement.setAttribute('data-theme', value)
	} else {
		document.documentElement.removeAttribute('data-theme')
	}
}

Vue.watch(function() { return prefs.theme }, applyTheme)

Vue.watch(currentLanguage, function(language) {
	document.documentElement.setAttribute('lang', language)
	if(typeof Fancybox !== 'undefined') {
		Fancybox.defaults.l10n = Object.assign({}, fancyboxDefaultL10n, translations[language].fancybox)
		Fancybox.Plugins.Toolbar.defaults.items.copyLink.label = translate(language, 'viewer.copyLink')
	}
}, {immediate: true})

const secondsToHms = function(d, emptyValue) {
	d = Number(d)
	let h = Math.floor(d / 3600)
	let m = Math.floor(d % 3600 / 60)
	let s = Math.floor(d % 3600 % 60)

	if(!h && !m && !s) {
		return emptyValue != null ? emptyValue : t('time.never')
	}

	let parts = []
	if(h > 0) parts.push(h + ' ' + t('time.hour', null, h))
	if(m > 0) parts.push(m + ' ' + t('time.minute', null, m))
	if(s > 0) parts.push(s + ' ' + t('time.second', null, s))
	return parts.join(', ')
}

const convertUniXDate = function(unixTimestamp) {
	try {
		return new Date(unixTimestamp * 1000).toLocaleString(currentLanguage.value)
	} catch(e) {
		console.warn('convertUniXDate', unixTimestamp)
	}
}

var app = Vue.createApp({
	setup() {
		const router = VueRouter.useRouter()

		let mittEventBus = Vue.inject('mittEventBus');

		const showSettings = function() {
			mittEventBus.emit('showSettings', {})
		}

		const redirectToMain = function() {
			router.push({ name: 'home'})
		}

		const setTheme = function(value) {
			prefs.theme = value
		}

		return {
			prefs,
			redirectToMain,
			setTheme,
			showSettings,
			version: settings.version
		}
	}
})

const mittEventBus = mitt()

app.config.globalProperties.t = t
app.provide('mittEventBus', mittEventBus);
app.provide('prefs', prefs);
app.provide('getLocalStorage', getLocalStorage);
app.provide('setLocalStorage', setLocalStorage);
app.provide('secondsToHms', secondsToHms);
app.provide('convertUniXDate', convertUniXDate);
app.provide('getDefaultImageWidth', getDefaultImageWidth)

const lazyVideoObserver = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(function(entries) {
	entries.forEach(function(entry) {
		if(entry.isIntersecting) {
			entry.target.src = entry.target.dataset.src
			lazyVideoObserver.unobserve(entry.target)
		}
	})
}, {rootMargin: '300px'})

app.directive('lazy-src', {
	mounted(el, binding) {
		el.dataset.src = binding.value
		if(lazyVideoObserver) {
			lazyVideoObserver.observe(el)
		} else {
			el.src = binding.value
		}
	},
	unmounted(el) {
		if(lazyVideoObserver) {
			lazyVideoObserver.unobserve(el)
		}
	}
})
