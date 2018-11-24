(function(){
  'use strict';

  	app.service('imagesService', function($http, $route) {
		this.getData = function(fileTypes) {
			return $http({
				url: 'inc/images.php',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: {receive: 'yes', startIndex: $route.current.params.startIndex, itemsPerPage: $route.current.params.itemsPerPage, fileTypes: fileTypes }
			});
		}
	});
})();