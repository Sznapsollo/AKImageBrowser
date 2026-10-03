const AboutComponent = {
	name: 'aboutComponent',
	template: `
	<div style="padding: 20px; text-align: left">
		<h2>About</h2>
		<p><strong>AKImageBrowser</strong> v{{version}} - quick deployable web image browser/gallery that displays images from the folder it is copied into.</p>
		<p>Features, settings and updates: <a target="_blank" href="https://github.com/Sznapsollo/AKImageBrowser">https://github.com/Sznapsollo/AKImageBrowser</a></p>
	</div>
	`,
	setup() {
		return {
			version: settings.version
		}
	}
}
