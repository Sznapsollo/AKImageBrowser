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
	if(!e || !e.key) {
		return
	}
	if(typeof mittEventBus === 'undefined') {
		return
	}
	var target = e.target;
	if(target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) {
		return
	}
	if(e.ctrlKey || e.metaKey || e.altKey || Fancybox.getInstance() || document.querySelector('dialog[open]')) {
		return
	}
	if(e.key === '/') {
		e.preventDefault();
	}

	mittEventBus.emit('handleKeyDownAction', {key: e.key});
}

function escapeHtml(text) {
	var div = document.createElement('div');
	div.textContent = text == null ? '' : String(text);
	return div.innerHTML;
}

var fancyboxDefaultL10n = Object.assign({}, Fancybox.defaults.l10n);

var COPY_LINK_ICON = '<svg viewBox="0 0 24 24"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>';
var COPIED_ICON = '<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>';

function copyText(text) {
	if(navigator.clipboard && window.isSecureContext) {
		return navigator.clipboard.writeText(text);
	}
	var area = document.createElement('textarea');
	area.value = text;
	area.style.position = 'fixed';
	area.style.opacity = '0';
	document.body.appendChild(area);
	area.select();
	try {
		document.execCommand('copy');
	} finally {
		document.body.removeChild(area);
	}
	return Promise.resolve();
}

function notifyImageChange(href) {
	if(typeof mittEventBus === 'undefined') {
		return
	}

	mittEventBus.emit('changeFancyBoxImage', {href: href});
}

function StartFancyBox()
{
	Fancybox.defaults.Hash = false
	Fancybox.Plugins.Toolbar.defaults.items.copyLink = {
		type: "button",
		label: translate('en', 'viewer.copyLink'),
		class: "fancybox__button--copylink",
		html: COPY_LINK_ICON,
		click: function(event) {
			event.preventDefault();
			var button = event.target.closest('button');
			copyText(window.location.href).then(function() {
				button.innerHTML = COPIED_ICON;
				button.title = t('viewer.linkCopied');
				setTimeout(function() {
					button.innerHTML = COPY_LINK_ICON;
					button.title = t('viewer.copyLink');
				}, 1500);
			});
		},
	};
	Fancybox.unbind('[data-fancybox]')
	Fancybox.bind('[data-fancybox="images"]', {
		Toolbar: {
			display: ["counter", "zoom", "slideshow", "fullscreen", "download", "copyLink", "thumbs", "close"],
		},
		caption: function (fancybox, carousel, slide) {
			return escapeHtml(slide.caption);
		},
		on: {
			destroy : (fancybox) => {
				notifyImageChange();
			},
			done: (fancybox, slide) => {
				notifyImageChange(slide.src);
			},
		},
	});
}

StartFancyBox();
