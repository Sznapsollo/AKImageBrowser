$(document).ready(function()
{
	StartFancyBox();
	
	$(window).scroll(function() {
		if ($(this).scrollTop() >= 50) 
		{        
			$('#return-to-top').fadeIn(200);    // Fade in the arrow
		} 
		else 
		{
			$('#return-to-top').fadeOut(200);   // Else fade out the arrow
		}
	});

	$("#pageWrapper").on("click", "#return-to-top", function(event) {
		$('body,html').animate({
			scrollTop : 0                       // Scroll to top of body
		}, 500);
	});
});

var fileTypesDefault = 'jpg, gif, png,';
var fileTypesStorageName = 'fileTypes';
var fileTimesStorageName = 'showFileTimes';
var fileNamesStorageName = 'showFileNames';
var itemsPerPageDefault = 48;
var itemsPerPageStorageName = 'itemsPerPage';
var imagesWidthDefault = 150;
var imagesWidthStorageName = 'imageWidth';
var hideDescriptionsStorageName = 'hideDescriptionsBelowWidth';
var hideDescriptionsStorageDefault = 100;
var autoRefreshStorageName = 'autoRefresh';
var autoRefreshIntervalStorageName = 'autoRefreshInterval';
var autoRefreshIntervalDefault = 120;

function applePie() {
	return ( navigator.userAgent.match(/(iPhone|iPod|iPad)/i) );
}

function StartFancyBox()
{
	$(".fancybox").fancybox({
		type: "image",
		afterShow: function() {
			$('.fancybox-wrap').swipe({
				swipe : function(event, direction) {
					if (direction === 'left' || direction === 'up') {
						$.fancybox.prev( direction );
					} else {
						$.fancybox.next( direction );
					}
				}
			});
			if ( applePie() ) { $('body').css({'position': 'fixed'}); } 
		},
		afterClose: function() {
			if ( applePie() ) { $('body').css({'position': ''}); }
		}
	 });
}

function GetLocalStorage(index, defaultValue) {
	if(localStorage[index] == undefined)
		return defaultValue;
	else {
	
		if(typeof defaultValue === 'boolean')
			return JSON.parse(localStorage[index]);
		else
			return localStorage[index];
	}
}

function SetLocalStorage(name, value) {
    localStorage[name] = value;
}

function CrankLogoUp() {	
	var testClassName = "performedCheck";
	if(!$("#logo").hasClass(testClassName)) {
		$("#logo").addClass(testClassName)
	}
	else
		return;

	$('#logoImage').css('visibility','visible').hide().fadeIn("slow", function() {
		 $('#logo a:first').addClass('animateLogo');
		 setTimeout(function() { 
			   $('#logo a:first').removeClass('animateLogo');
			 }, 1000);
	});
};

