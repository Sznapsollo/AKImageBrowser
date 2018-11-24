var app = {};

(function(){
	'use strict';
	app = angular.module('imagesBrowser', ['ngRoute'])
	.config(function($routeProvider, $locationProvider){
		$locationProvider.hashPrefix('');
		$routeProvider.when('/images/:startIndex/:itemsPerPage/:imageName?', {
			templateUrl: 'templates/images.html',
			controller: 'ImagesController',
			reloadOnSearch: false
		});

	$routeProvider.otherwise({
		redirectTo: '/images/0/'+GetLocalStorage(settings.itemsPerPageStorageName, settings.itemsPerPageDefault)
	});

	});
}());
