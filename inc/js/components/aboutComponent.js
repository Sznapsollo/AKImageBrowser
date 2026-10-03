const AboutComponent = {
	name: 'aboutComponent',
	template: `
	<div style="padding: 20px; text-align: left">
		<h2>{{ t('nav.about') }}</h2>
		<p><strong>AKImageBrowser</strong> v{{version}} - {{ t('about.text') }}</p>
		<p>{{ t('about.links') }} <a target="_blank" href="https://github.com/Sznapsollo/AKImageBrowser">https://github.com/Sznapsollo/AKImageBrowser</a></p>
	</div>
	`,
	setup() {
		return {
			version: settings.version
		}
	}
}
