(function(){
  'use strict';
	app.controller('PagerController',  
    function PagerController($scope, $route, $location)
	{		
		$scope.pages = [];
		$scope.itemsPerPageArray = [12,24,48,96,192,384,768]
		$scope.selectedPage = 0;
		$scope.selectedItemsPerPage =  parseInt(GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault));
		$scope.updateItemsPerPage = function() 
		{
			SetLocalStorage("itemsPerPage", $scope.selectedItemsPerPage);
			$location.path('/images/0/'+GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault));
		}
		$scope.updateSelectedPage = function() 
		{
			$location.path('/images/'+$scope.selectedPage*$scope.itemsPerPage+'/'+GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault));
		}
	
		$scope.canGoBack = function()
		{
			return $scope.startIndex > 0;
		}

		$scope.canGoNext = function()
		{
			return $scope.startIndex + $scope.itemsPerPage < $scope.totalItems;
		}
	
		$scope.$on('calculateImagesPaging', function(event, allCount) 
		{ 
			$scope.startIndex = parseInt($route.current.params.startIndex, 0);
			$scope.itemsPerPage = parseInt($route.current.params.itemsPerPage, 0);
			$scope.totalItems = parseInt(allCount, 0);
			
			if($scope.itemsPerPage <= 0)
				$scope.itemsPerPage = GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault);
			
			$scope.selectedPage = $scope.startIndex/$scope.itemsPerPage;
			var pagesNumber = $scope.totalItems/$scope.itemsPerPage;
			for (var i = 0; i < pagesNumber; i++) { 
				$scope.pages.push(i);
			}
			
			if($scope.startIndex > 0) {
				$scope.firstNode = 0;
				
				if($scope.startIndex - $scope.itemsPerPage > 0)
					$scope.previousNode = $scope.startIndex - $scope.itemsPerPage;
				else 
					$scope.previousNode = 0;
			}	
			
			if($scope.startIndex + $scope.itemsPerPage < $scope.totalItems) {
				$scope.nextNode = $scope.startIndex + $scope.itemsPerPage;
				
				$scope.lastNode = $scope.totalItems - $scope.itemsPerPage;
				var itemsRound = GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault)+2;
				
				for(var i=0; i<=itemsRound; i++)
				{
					var calculate = $scope.totalItems - $scope.itemsPerPage + i;
					if(calculate % GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault) == 0)
					{
						$scope.lastNode = calculate;
						break;
					}
				}
			}
		});
    }
  );
})();