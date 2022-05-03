const AboutComponent = { 
	name: 'aboutComponent',
	template: `
	<div style="padding: 20px; text-align: left">
		<h2>About</h2>
		<strong>AKImageBrowser</strong> is quick deployable web image browser/gallery that will display images from given folder. It bases on php (backend side) and Vue (frontend side).
		<p/>
		Github link: <a target="_blank" href="https://github.com/Sznapsollo/AKImageBrowser">https://github.com/Sznapsollo/AKImageBrowser</a>
		<p/>
		AKImageBrowser has some features that make image browsing a bit more pleasant:
		<ul>
			<li>paging with options to choose how many images per page should be displayed</li>
			<li>lazy loading -> images will load when user actually displays them</li>
			<li>filtering of image types -> user can set what type of file extensions should be displayed [in options]</li>
			<li>image scaling -> user can adjust size of images to be displayed in gallery. [in options]</li>
			<li>optional showing image name and image change date in images list</li>
			<li>option to hide image descriptions whenl image size lower than specified value</li>
			<li>option to autorefresh gallery, refresh interval can be changed</li>
		</ul>
	</div>
	`,
	setup() {
		Vue.onMounted(function() {
			console.log('AboutComponent mounted')
		})
	}
}
