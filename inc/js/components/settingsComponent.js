app.component('settings-component' , { 
	name: 'settingsComponent',
	template: `
		<!-- Modal -->
		<div class="modal fade" id="settingsModal" role="dialog">
			<div class="modal-dialog">

			<!-- Modal content-->
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">Options</h5>
					<button type="button" class="close" data-dismiss="modal" @click="closeOptions()">
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body">
					<div class="container">
						<div class="form-group">
							<label for="imageWidth">Image size: {{imageWidth}}px</label>
							&nbsp;&nbsp;
							<a href="#" @click="resetImageWidth()">reset</a>
							<input id="imageWidth" type="range" class="form-control" min="50" v-bind:max="maxWidth" v-model="imageWidth" v-on:change="rememberImageWidth()">
						</div>

						<div class="form-check">
							<input class="form-check-input" type="checkbox" v-model="showFileTimes" id="showFileTimes">
							<label class="form-check-label" for="showFileTimes">
								Show file change times
							</label>
						</div>

						<div class="form-check">
							<input class="form-check-input" type="checkbox" v-model="showFileNames" id="showFileNames">
							<label class="form-check-label" for="showFileNames">
								Show file names
							</label>
						</div>

						<br>
						<div class="form-group">
							<label for="hideDescriptionsBelow">Hide text below image width: {{hideDescriptionsBelow}}px</label>
							&nbsp;&nbsp;
							<a href="#" @click="resetHideDescriptionsBelow()">reset</a>
							<input id="hideDescriptionsBelow" type="range" class="form-control" step="10" min="0" max="1000" v-model="hideDescriptionsBelow">
						</div>

						<div class="form-check">
							<input class="form-check-input" type="checkbox" v-model="autoRefresh" id="autoRefresh">
							<label class="form-check-label" for="autoRefresh">
								Auto refresh
							</label>
						</div>

						<br>
						<div class="form-group">
							<label for="refreshEvery">Refresh every: {{translateRefreshInterval()}}</label>
							<input id="refreshEvery" type="range" class="form-control" step="10" min="0" max="10000" v-model="autoRefreshInterval">
						</div>

						<div class="form-group">
							<label for="resetfileTypes">File types (example: jpg, gif, png,) - will require clicking "Apply"</label>
							&nbsp;&nbsp;
							<a href="#" @click="resetfileTypes()">reset</a>
							<input id="resetfileTypes" type="text" class="form-control" v-model="fileTypes" />
						</div>
					</div>
				</div>
				<div class="modal-footer">
					"Save" will cache these settings for future browsing &nbsp;&nbsp;
					<button type="button" class="btn btn-primary" @click="saveOptions()" data-dismiss="modal">Save</button>
				</div>
			</div>
			
			</div>
		</div>
	`,
	setup() {
		const route = VueRouter.useRoute()
		const router = VueRouter.useRouter()

		let mittEventBus = Vue.inject('mittEventBus');
		let getLocalStorage = Vue.inject('getLocalStorage');

		const imageWidth = Vue.ref(parseInt(getLocalStorage(settings.imagesWidthStorageName, settings.imagesWidthDefault)));
		const fileTypes = Vue.ref(getLocalStorage(settings.fileTypesStorageName, settings.fileTypesDefault));
		const showFileTimes = Vue.ref(getLocalStorage(settings.fileTimesStorageName, true));
		const showFileNames = Vue.ref(getLocalStorage(settings.fileNamesStorageName, true));
		const autoRefresh = Vue.ref(getLocalStorage(settings.autoRefreshStorageName, false));
		const autoRefreshInterval = Vue.ref(parseInt(getLocalStorage(settings.autoRefreshIntervalStorageName, settings.autoRefreshIntervalDefault)));
		const hideDescriptionsBelow = Vue.ref(parseInt(getLocalStorage(settings.hideDescriptionsStorageName, settings.hideDescriptionsStorageDefault)));

		const maxWidth = Vue.ref($("#middleSection .inner").width());

		const closeOptions = function() {
			reloadRoute();
		}

		const reloadRoute = function() {
			router.go()
		}

		const rememberImageWidth = function() {
			
		}

		const resetHideDescriptionsBelow = function() {
			hideDescriptionsBelow.value = settings.hideDescriptionsStorageDefault;
		}

		const resetfileTypes = function() {
			fileTypes.value = settings.fileTypesDefault;
		}

		const resetImageWidth = function() {
			imageWidth.value = settings.imagesWidthDefault;
		}

		function secondsToHms(d) {
			d = Number(d);
			var h = Math.floor(d / 3600);
			var m = Math.floor(d % 3600 / 60);
			var s = Math.floor(d % 3600 % 60);
		
			if(!h & !m && !s) {
				return "Never"
			}

			var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
			var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
			var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
			return hDisplay + mDisplay + sDisplay; 
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
			
			this.closeOptions();
		}

		Vue.onMounted(function() {
			console.log('SettingsComponent mounted')

			getLocalStorage()

			mittEventBus.on('showSettings', (args) => {
				if(!args) {
					args = {};
				}

				maxWidth.value = $("#middleSection .inner").width();
				$('#settingsModal').modal('show');
			})
		})

		return {
			autoRefresh,
			autoRefreshInterval,
			hideDescriptionsBelow,
			closeOptions,
			fileTypes,
			imageWidth,
			maxWidth,
			rememberImageWidth,
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
