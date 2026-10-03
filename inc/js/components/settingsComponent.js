app.component('settings-component' , { 
	name: 'settingsComponent',
	template: `
		<dialog id="settingsModal" class="settingsDialog" @click="onDialogClick">
			<div class="dialogHeader">
				<h5>Options</h5>
				<button type="button" class="closeButton" aria-label="Close" @click="closeOptions()">&times;</button>
			</div>
			<div class="dialogBody">
				<div class="formGroup">
					<label for="imageWidth">Image size: {{imageWidth}}px</label>
					&nbsp;&nbsp;
					<a href="#" @click.prevent="resetImageWidth()">reset</a>
					<input id="imageWidth" type="range" min="50" v-bind:max="maxWidth" v-model="imageWidth">
				</div>

				<label class="formCheck">
					<input type="checkbox" v-model="showFileTimes">
					Show file change times
				</label>

				<label class="formCheck">
					<input type="checkbox" v-model="showFileNames">
					Show file names
				</label>

				<div class="formGroup">
					<label for="hideDescriptionsBelow">Hide text below image width: {{hideDescriptionsBelow}}px</label>
					&nbsp;&nbsp;
					<a href="#" @click.prevent="resetHideDescriptionsBelow()">reset</a>
					<input id="hideDescriptionsBelow" type="range" step="10" min="0" max="1000" v-model="hideDescriptionsBelow">
				</div>

				<label class="formCheck">
					<input type="checkbox" v-model="autoRefresh">
					Auto refresh
				</label>

				<div class="formGroup">
					<label for="refreshEvery">Refresh every: {{translateRefreshInterval()}}</label>
					<input id="refreshEvery" type="range" step="10" min="0" max="10000" v-model="autoRefreshInterval">
				</div>

				<div class="formGroup">
					<label for="resetfileTypes">File types (example: jpg, png, mp4) - empty shows all allowed types</label>
					&nbsp;&nbsp;
					<a href="#" @click.prevent="resetfileTypes()">reset</a>
					<input id="resetfileTypes" type="text" placeholder="all allowed types" v-model="fileTypes" />
				</div>
			</div>
			<div class="dialogFooter">
				"Save" will cache these settings for future browsing &nbsp;&nbsp;
				<button type="button" class="btn btnPrimary" @click="saveOptions()">Save</button>
			</div>
		</dialog>
	`,
	setup() {
		const route = VueRouter.useRoute()
		const router = VueRouter.useRouter()

		let mittEventBus = Vue.inject('mittEventBus');
		let getLocalStorage = Vue.inject('getLocalStorage');
		let secondsToHms = Vue.inject('secondsToHms');
		let getDefaultImageWidth = Vue.inject('getDefaultImageWidth');

		const imageWidth = Vue.ref(parseInt(getLocalStorage(settings.imagesWidthStorageName, getDefaultImageWidth())));
		const fileTypes = Vue.ref(getLocalStorage(settings.fileTypesStorageName, settings.fileTypesDefault));
		const showFileTimes = Vue.ref(getLocalStorage(settings.fileTimesStorageName, true));
		const showFileNames = Vue.ref(getLocalStorage(settings.fileNamesStorageName, true));
		const autoRefresh = Vue.ref(getLocalStorage(settings.autoRefreshStorageName, false));
		const autoRefreshInterval = Vue.ref(parseInt(getLocalStorage(settings.autoRefreshIntervalStorageName, settings.autoRefreshIntervalDefault)));
		const hideDescriptionsBelow = Vue.ref(parseInt(getLocalStorage(settings.hideDescriptionsStorageName, settings.hideDescriptionsStorageDefault)));

		const maxWidth = Vue.ref(1000);

		const getDialog = function() {
			return document.getElementById('settingsModal');
		}

		const getContentWidth = function() {
			let inner = document.querySelector('#middleSection .inner');
			return inner ? inner.clientWidth : 1000;
		}

		const closeOptions = function() {
			getDialog().close();
		}

		const onDialogClick = function(e) {
			if(e.target === getDialog()) {
				closeOptions();
			}
		}

		const reloadRoute = function() {
			router.go()
		}

		const resetHideDescriptionsBelow = function() {
			hideDescriptionsBelow.value = settings.hideDescriptionsStorageDefault;
		}

		const resetfileTypes = function() {
			fileTypes.value = settings.fileTypesDefault;
		}

		const resetImageWidth = function() {
			imageWidth.value = getDefaultImageWidth();
		}

		const translateRefreshInterval = function() {
			return secondsToHms(autoRefreshInterval.value)
		}

		const saveOptions = function() {
			setLocalStorage(settings.fileTypesStorageName, fileTypes.value);
			setLocalStorage(settings.imagesWidthStorageName, imageWidth.value);
			setLocalStorage(settings.fileTimesStorageName, showFileTimes.value);
			setLocalStorage(settings.fileNamesStorageName, showFileNames.value);
			setLocalStorage(settings.hideDescriptionsStorageName, hideDescriptionsBelow.value);
			setLocalStorage(settings.autoRefreshStorageName, autoRefresh.value);
			setLocalStorage(settings.autoRefreshIntervalStorageName, autoRefreshInterval.value);

			reloadRoute();
		}

		Vue.onMounted(function() {
			console.log('SettingsComponent mounted')

			mittEventBus.on('showSettings', (args) => {
				if(!args) {
					args = {};
				}

				imageWidth.value = parseInt(getLocalStorage(settings.imagesWidthStorageName, getDefaultImageWidth()));
				fileTypes.value = getLocalStorage(settings.fileTypesStorageName, settings.fileTypesDefault);
				showFileTimes.value = getLocalStorage(settings.fileTimesStorageName, true);
				showFileNames.value = getLocalStorage(settings.fileNamesStorageName, true);
				autoRefresh.value = getLocalStorage(settings.autoRefreshStorageName, false);
				autoRefreshInterval.value = parseInt(getLocalStorage(settings.autoRefreshIntervalStorageName, settings.autoRefreshIntervalDefault));
				hideDescriptionsBelow.value = parseInt(getLocalStorage(settings.hideDescriptionsStorageName, settings.hideDescriptionsStorageDefault));

				maxWidth.value = getContentWidth();
				getDialog().showModal();
			})
		})

		return {
			autoRefresh,
			autoRefreshInterval,
			hideDescriptionsBelow,
			closeOptions,
			onDialogClick,
			fileTypes,
			imageWidth,
			maxWidth,
			resetHideDescriptionsBelow,
			resetfileTypes,
			resetImageWidth,
			showFileNames,
			showFileTimes,
			saveOptions,
			translateRefreshInterval
		}
	}
})
