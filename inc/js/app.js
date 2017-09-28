var app = {};

(function(){
  'use strict';
  app = angular.module('imagesBrowser', ['ngRoute'])
    .config(function($routeProvider, $locationProvider){
	  $routeProvider.when('/images/:startIndex/:itemsPerPage', {
        templateUrl: 'templates/images.html',
        controller: 'ImagesController'
      });
	  
      $routeProvider.otherwise({
        redirectTo: '/images/0/'+GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault)
      });

    });
}());
