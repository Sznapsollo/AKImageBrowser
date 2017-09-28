(function(){
  'use strict';
	
	app.controller('MenuBottomController', function MenuController($scope, $location) {
		$scope.getClass = function(path) {
			if ($location.path().substr(0, path.length) == path) {
			  return "menuBottomActive"
			} else {
			  return ""
			}
		}
	});
  
})();