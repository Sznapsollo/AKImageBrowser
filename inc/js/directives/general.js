(function() {
  
	app.directive('pageFooter', function() {
		return {
			restrict: 'E',
			templateUrl: 'templates/directives/pagefooter.html'
		};
	});
	
	app.directive('pager', function() {
		return {
			restrict: 'E',
			templateUrl: 'templates/directives/pager.html',
			controller: 'PagerController'
		};
	});
	
})();
