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

		const theme = Vue.ref(getLocalStorage(settings.themeStorageName, settings.themeDefault))

		const setTheme = function(value) {
			theme.value = value
			setLocalStorage(settings.themeStorageName, value)
			if(value === 'light' || value === 'dark') {
				document.documentElement.setAttribute('data-theme', value)
			} else {
				document.documentElement.removeAttribute('data-theme')
			}
		}

		Vue.onMounted(function() {
			console.log('App mounted');
		})

		return {
			redirectToMain,
			setTheme,
			showSettings,
			theme,
			version: settings.version
		}
	}
})

const getLocalStorage = function(index, defaultValue) {
	if(typeof localStorage === 'undefined') {
		return defaultValue
	}

	if(localStorage[index] == undefined)
		return defaultValue;
	else {
	
		if(typeof defaultValue === 'boolean')
			return JSON.parse(localStorage[index]);
		else
			return localStorage[index];
	}
}

const setLocalStorage = function(name, value) {
    if(typeof localStorage === 'undefined') {
		return
	}

	localStorage[name] = value;
}

const secondsToHms = function(d, emptyValue) {
	d = Number(d);
	var h = Math.floor(d / 3600);
	var m = Math.floor(d % 3600 / 60);
	var s = Math.floor(d % 3600 % 60);

	emptyValue = emptyValue != null ? emptyValue : 'Never'

	if(!h & !m && !s) {
		return emptyValue
	}

	var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
	var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
	var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
	return hDisplay + mDisplay + sDisplay; 
}

const convertUniXDate = function(unixTimestamp) {
	try {
		return new Date(unixTimestamp*1000).toLocaleString();
	} catch(e) {
		console.warn('convertUniXDate', unixTimestamp)
	}
}

const getDefaultImageWidth = function() {
	if(typeof settings !== 'undefined' && settings.imagesWidthDefault) {
		if(window && window.innerWidth && window.innerWidth <= 500) {
			return window.innerWidth - 60;
		}
		return settings.imagesWidthDefault
	}
	return 200
}

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
