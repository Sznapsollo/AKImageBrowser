document.addEventListener('keydown', manageKeyDown);

window.addEventListener('scroll', function() {
	document.getElementById('return-to-top').classList.toggle('visible', window.scrollY >= 50);
}, {passive: true});

document.addEventListener('click', function(e) {
	if(e.target && e.target.id === 'return-to-top') {
		window.scrollTo({top: 0, behavior: 'smooth'});
	}
});

function manageKeyDown(e) {
	if(!e || !e.key || !window) {
		return
	}
	if(typeof mittEventBus === 'undefined') {
		return
	}
	var target = e.target;
	if(target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) {
		return
	}

	mittEventBus.emit('handleKeyDownAction', {key: e.key});
}

function escapeHtml(text) {
	var div = document.createElement('div');
	div.textContent = text == null ? '' : String(text);
	return div.innerHTML;
}

function manageHash(href) {
	if(typeof mittEventBus === 'undefined') {
		return
	}

	mittEventBus.emit('changeFancyBoxImage', {href: href});
}

function StartFancyBox()
{
	Fancybox.defaults.Hash = false
	Fancybox.unbind('[data-fancybox]')
	Fancybox.bind('[data-fancybox="images"]', {
		Toolbar: {
			display: ["counter", "zoom", "slideshow", "fullscreen", "download", "thumbs", "close"],
		},
		caption: function (fancybox, carousel, slide) {
			return escapeHtml(slide.caption);
		},
		on: {
			destroy : (fancybox) => {
				manageHash();
			},
			done: (fancybox, slide) => {
				manageHash(slide.src);
			},
		},
	});
}

StartFancyBox();
