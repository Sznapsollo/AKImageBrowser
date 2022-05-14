$(document).ready(function()
{
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

function applePie() {
	return ( navigator.userAgent.match(/(iPhone|iPod|iPad)/i) );
}


function manageHash(href) {
	if(typeof mittEventBus === 'undefined') {
		return
	}

	mittEventBus.emit('changeFancyBoxImage', {href: href});
}

function getScope() {
    // var sel = '.pageContent';
    // return angular.element(sel).scope();
	return null
}

function StartFancyBox(groupName)
{
	groupName = groupName ? groupName : 'images'
	// console.log('StartFancyBox')
	Fancybox.defaults.Hash = false
	Fancybox.bind('[data-fancybox="' + groupName + '"]', {
		caption: function (fancybox, carousel, slide) {
			// `${slide.index + 1} / ${carousel.slides.length} <br />` + slide.caption
			return (
				`${slide.caption}`
		  	);
		},
		on: {
			// "*": (event, fancybox, slide) => {
			// 	console.log(`event: ${event}`, slide);
			// },
			// ready : (fancybox) => {
			// 	// console.log(`fancybox #${fancybox.id} is ready!`);
			// },
			destroy : (fancybox) => {
				manageHash();
			},
			done: (fancybox, slide) => {
				console.log(slide)
				manageHash(slide.src);
				//   console.log(`#${slide.index} slide is done!`);
				//   console.log(
				// 	`This slide is selected: ${fancybox.getSlide().index === slide.index}`
				//   );
			},
		  },
	  });


	// $("#popupOnStartLink, .fancybox").fancybox({
	// 	type: "image",
	// 	afterShow: function() {
	// 		manageHash(this.href);
	// 		// $('.fancybox-wrap').swipe({
	// 		// 	swipe : function(event, direction) {
	// 		// 		if (direction === 'left' || direction === 'up') {
	// 		// 			$.fancybox.prev( direction );
	// 		// 		} else {
	// 		// 			$.fancybox.next( direction );
	// 		// 		}
	// 		// 	}
	// 		// });
	// 		if ( applePie() ) { $('body').css({'position': 'fixed'}); } 
	// 	},
	// 	afterClose: function() {
	// 		manageHash(null);
	// 		if ( applePie() ) { $('body').css({'position': ''}); }
	// 	}
	//  });
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

