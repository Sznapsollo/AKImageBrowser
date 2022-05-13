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
		var date = new Date(unixTimestamp*1000);
		// console.log("Unix Timestamp:",unixTimestamp)
		// console.log("Date Timestamp:",date.getTime())
		// console.log(date)
		return (""+date.getDate()+
				"/"+(date.getMonth()+1)+
				"/"+date.getFullYear()+
				" "+date.getHours()+
				":"+date.getMinutes()+
				":"+date.getSeconds());
	} catch(e) {
		console.warn('convertUniXDate', unixTimestamp)
	}
}

app.provide('getLocalStorage', getLocalStorage);
app.provide('setLocalStorage', setLocalStorage);
app.provide('secondsToHms', secondsToHms);
app.provide('convertUniXDate', convertUniXDate);