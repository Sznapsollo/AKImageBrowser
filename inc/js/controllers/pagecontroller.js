(function(){

  'use strict';

  app.controller('PageController',
    function PageController($scope, $route, $location, $timeout) {
		
		
		var self = this;
		this.timerAutoRefresh;
		this.imageWidth = parseInt(GetLocalStorage(settings.imagesWidthStorageName, settings.imagesWidthDefault));
		this.fileTypes = GetLocalStorage(settings.fileTypesStorageName, settings.fileTypesDefault);
		this.showFileTimes = GetLocalStorage(settings.fileTimesStorageName, true);
		this.showFileNames = GetLocalStorage(settings.fileNamesStorageName, true);
		this.autoRefresh = GetLocalStorage(settings.autoRefreshStorageName, false);
		this.autoRefreshInterval = parseInt(GetLocalStorage(settings.autoRefreshIntervalStorageName, settings.autoRefreshIntervalDefault));
		this.hideDescriptionsBelow = parseInt(GetLocalStorage(settings.hideDescriptionsStorageName, settings.hideDescriptionsStorageDefault));
		this.fileTypesTemp = this.fileTypes;
		
		this.maxWidth = $("#middleSection .inner").width();
	
		this.showDescriptions = function() {
			return this.imageWidth > this.hideDescriptionsBelow;
		}
	
		this.redirectToMain = function() {
			$location.path('/images/0/' + GetLocalStorage(settings.itemsPerPageStorageName, settings.itemsPerPageDefault));
		}
		
		this.rememberImageWidth = function(value) {
			
		}
		
		this.closeOptions = function() {
			reloadRoute();
		}
		
		this.saveOptions = function() {
			SetLocalStorage(settings.fileTypesStorageName, this.fileTypes);
			SetLocalStorage(settings.imagesWidthStorageName, this.imageWidth);
			SetLocalStorage(settings.fileTimesStorageName, this.showFileTimes);
			SetLocalStorage(settings.fileNamesStorageName, this.showFileNames);
			SetLocalStorage(settings.hideDescriptionsStorageName, this.hideDescriptionsBelow);
			SetLocalStorage(settings.autoRefreshStorageName, this.autoRefresh);
			SetLocalStorage(settings.autoRefreshIntervalStorageName, this.autoRefreshInterval);
			
			this.closeOptions();
			initAutoRefresh();
		}
		
		this.resetfileTypes = function() {
			this.fileTypes = settings.fileTypesDefault;
		}
		
		this.resetImageWidth = function() {
			this.imageWidth = settings.imagesWidthDefault;
		}
		
		this.resetHideDescriptionsBelow = function() {
			this.hideDescriptionsBelow = settings.hideDescriptionsStorageDefault;
		}
		
		function initAutoRefresh()
		{
			if(self.timerAutoRefresh)
				$timeout.cancel(self.timerAutoRefresh);
		
			checkInterval(reloadRoute, autoRefreshTimeInterval, canRunAutoRefresh);
		};
		
		function checkInterval(fn, timeInterval, canProceed) {
		
			if(!canProceed())
				return;
		
			timerAutoRefresh = setTimeout(fn, 1000 * timeInterval());
			
			return self.timerAutoRefresh.then(function(data) {
				checkInterval(fn, timeInterval, canProceed);
			});
		}
		
		function canRunAutoRefresh() {
			return self.autoRefresh;
		}
		
		function autoRefreshTimeInterval() {
			return self.autoRefreshInterval;
		}
		
		function reloadRoute() {
			$route.reload();
		}
		
		$scope.$on('$destroy', function(){
			$timeout.cancel(self.timerAutoRefresh);
		});
		
		initAutoRefresh();
    }
  );

})();