app.component('settings-component' , {
	name: 'settingsComponent',
	template: `
		<dialog id="settingsModal" class="settingsDialog" @click="onDialogClick">
			<div class="dialogHeader">
				<h5>{{ t('options.title') }}</h5>
				<button type="button" class="closeButton" :aria-label="t('options.close')" @click="closeOptions()">&times;</button>
			</div>
			<div class="dialogBody">
				<div class="formGroup">
					<label for="imageWidth">{{ t('options.imageSize', {px: prefs.imageWidth}) }}</label>
					&nbsp;&nbsp;
					<a href="#" @click.prevent="prefs.imageWidth = getDefaultImageWidth()">{{ t('options.reset') }}</a>
					<input id="imageWidth" type="range" min="50" step="10" v-bind:max="maxWidth" v-model.number="prefs.imageWidth">
				</div>

				<div class="formGroup">
					<label for="tileMode">{{ t('options.thumbnails') }}</label>
					<select id="tileMode" v-model="prefs.tileMode">
						<option value="crop">{{ t('options.tileCrop') }}</option>
						<option value="fit">{{ t('options.tileFit') }}</option>
						<option value="original">{{ t('options.tileOriginal') }}</option>
					</select>
				</div>

				<label class="formCheck">
					<input type="checkbox" v-model="prefs.showFileTimes">
					{{ t('options.showTimes') }}
				</label>

				<label class="formCheck">
					<input type="checkbox" v-model="prefs.showFileNames">
					{{ t('options.showNames') }}
				</label>

				<div class="formGroup">
					<label for="hideDescriptionsBelow">{{ t('options.hideBelow', {px: prefs.hideDescriptionsBelow}) }}</label>
					&nbsp;&nbsp;
					<a href="#" @click.prevent="prefs.hideDescriptionsBelow = settings.hideDescriptionsStorageDefault">{{ t('options.reset') }}</a>
					<input id="hideDescriptionsBelow" type="range" step="10" min="0" max="1000" v-model.number="prefs.hideDescriptionsBelow">
				</div>

				<label class="formCheck">
					<input type="checkbox" v-model="prefs.autoRefresh">
					{{ t('options.autoRefresh') }}
				</label>

				<div class="formGroup">
					<label for="refreshEvery">{{ t('options.refreshEvery', {time: secondsToHms(prefs.autoRefreshInterval)}) }}</label>
					<input id="refreshEvery" type="range" step="10" min="0" max="10000" v-model.number="prefs.autoRefreshInterval">
				</div>

				<div class="formGroup">
					<label for="resetfileTypes">{{ t('options.fileTypes') }}</label>
					&nbsp;&nbsp;
					<a href="#" @click.prevent="prefs.fileTypes = settings.fileTypesDefault">{{ t('options.reset') }}</a>
					<input id="resetfileTypes" type="text" :placeholder="t('options.fileTypesPlaceholder')" v-model="prefs.fileTypes" />
				</div>

				<div class="formGroup">
					<label for="language">{{ t('options.language') }}</label>
					<select id="language" v-model="prefs.language">
						<option value="auto">{{ t('options.languageAuto') }}</option>
						<option value="en">English</option>
						<option value="pl">Polski</option>
					</select>
				</div>
			</div>
			<div class="dialogFooter">
				<span class="dialogNote">{{ t('options.note') }}</span>
				<button type="button" class="btn btnPrimary" @click="closeOptions()">{{ t('options.close') }}</button>
			</div>
		</dialog>
	`,
	setup() {
		let mittEventBus = Vue.inject('mittEventBus');
		let secondsToHms = Vue.inject('secondsToHms');
		let getDefaultImageWidth = Vue.inject('getDefaultImageWidth');
		let prefs = Vue.inject('prefs');

		const maxWidth = Vue.ref(1000);

		const getDialog = function() {
			return document.getElementById('settingsModal');
		}

		const closeOptions = function() {
			getDialog().close();
		}

		const onDialogClick = function(e) {
			if(e.target === getDialog()) {
				closeOptions();
			}
		}

		const showOptions = function() {
			let inner = document.querySelector('#middleSection .inner');
			maxWidth.value = Math.max(prefs.imageWidth, inner ? inner.clientWidth - 30 : 1000);
			getDialog().showModal();
		}

		Vue.onMounted(function() {
			mittEventBus.on('showSettings', showOptions)
		})

		return {
			closeOptions,
			getDefaultImageWidth,
			maxWidth,
			onDialogClick,
			prefs,
			secondsToHms,
			settings
		}
	}
})
