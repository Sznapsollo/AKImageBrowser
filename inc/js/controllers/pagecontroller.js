(function(){
  'use strict';
  app.controller('PageController',
    function PageController($scope, $route, $location) {
		this.redirectToMain = function() {
			$location.path('/images/0/' + GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault));
		};
    }
  );
})();