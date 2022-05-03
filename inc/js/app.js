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

		Vue.onMounted(function() {
			console.log('App mounted')
		})

		return {
			redirectToMain,
			showSettings
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

app.provide('getLocalStorage', getLocalStorage)
app.provide('setLocalStorage', setLocalStorage)