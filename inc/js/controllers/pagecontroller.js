(function(){
  'use strict';
  app.controller('PageController',
    function PageController($scope, $route, $location) {				this.imageWidth = GetLocalStorage(imagesWidthStorageName, imagesWidthDefault);		this.fileTypes = GetLocalStorage(fileTypesStorageName, fileTypesDefault);		this.showFileTimes = GetLocalStorage(fileTimesStorageName, true);		this.showFileNames = GetLocalStorage(fileNamesStorageName, true);		this.hideDescriptionsBelow = GetLocalStorage(hideDescriptionsStorageName, hideDescriptionsStorageDefault);		this.fileTypesTemp = this.fileTypes;				this.maxWidth = $("#middleSection .inner").width();			this.showDescriptions = function() {			return this.imageWidth > this.hideDescriptionsBelow;		}	
		this.redirectToMain = function() {
			$location.path('/images/0/' + GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault));
		};				this.rememberImageWidth = function(value) {					}				this.closeOptions = function() {			$route.reload();		}				this.saveOptions = function() {			SetLocalStorage(fileTypesStorageName, this.fileTypes);			SetLocalStorage(imagesWidthStorageName, this.imageWidth);			SetLocalStorage(fileTimesStorageName, this.showFileTimes);			SetLocalStorage(fileNamesStorageName, this.showFileNames);			SetLocalStorage(hideDescriptionsStorageName, this.hideDescriptionsBelow);			this.closeOptions();		}				this.resetfileTypes = function() {			this.fileTypes = fileTypesDefault;		}				this.resetImageWidth = function() {			this.imageWidth = imagesWidthDefault;		}				this.resetHideDescriptionsBelow = function() {			this.hideDescriptionsBelow = hideDescriptionsStorageDefault;		}
    }
  );
})();