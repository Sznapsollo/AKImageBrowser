(function(){
  'use strict';
  app.controller('PageController',
    function PageController($scope, $route, $location) {				this.imageWidth = GetLocalStorage(imagesWidthStorageName, imagesWidthDefault);		this.fileTypes = GetLocalStorage(fileTypesStorageName, fileTypesDefault);		this.fileTypesTemp = this.fileTypes;				this.maxWidth = $("#middleSection .inner").width();	
		this.redirectToMain = function() {
			$location.path('/images/0/' + GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault));
		};				this.rememberImageWidth = function(value) {			SetLocalStorage("imageWidth", value);		}				this.closeOptions = function() {			this.fileTypesTemp = this.fileTypes;			$route.reload();		}				this.saveOptions = function() {			SetLocalStorage("fileTypes", this.fileTypesTemp);			this.fileTypes = this.fileTypesTemp;			this.closeOptions();		}				this.resetfileTypes = function() {			this.fileTypesTemp = fileTypesDefault;		}				this.resetImageWidth = function() {			this.imageWidth = imagesWidthDefault;		}
    }
  );
})();