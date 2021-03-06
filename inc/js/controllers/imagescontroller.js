(function(){
  'use strict';

  app.controller('ImagesController',
    function ImagesController($scope, $routeParams, $timeout, $location, imagesService)
	{
		$scope.imagescount = 0;
		$scope.dataLoading = true;
		$scope.changeFancyBoxImage = changeFancyBoxImage;
		$scope.url="";
	
		$scope.$on('$routeChangeSuccess',function(evt, absNewUrl, absOldUrl) {
			if($routeParams.imageName) {
				$("#popupOnStartLink").attr("href", $scope.url+$routeParams.imageName);
				StartFancyBox();
				$("#popupOnStartLink").trigger("click");
				
			}
			getImages();
		});
		
		$scope.showNoResults = function() {
			if($scope.allCount != undefined)
				return $scope.allCount == 0;
			else
				return false;
		}
		
		function changeFancyBoxImage(image) {
			$location.search({imageName: image});
		}
		
		function getImages() {
			$scope.dataLoading = true;
			imagesService.getData($scope.pageController.fileTypes).then(
			function(dataResponse) {
				$scope.dataLoading = false;
				$scope.imagesList = dataResponse.data.images;
				$scope.allCount = dataResponse.data.allCount;
				$timeout(function()
				{
					$scope.$broadcast('calculateImagesPaging', $scope.allCount);
					StartFancyBox();
				}, 100); 
			},

			function(response) {
				$scope.dataLoading = false;
				console.log('Images read error');
			});
		}
    }
  );
})();