var HeaderAuthController = function($scope, $rootScope, $http, $popup)
{	
	$scope.apiRoot = window.CONFIG.paths.apiRoot;
	$scope.user = undefined;
	$scope.activeHomey = $rootScope.activeHomey = undefined;
	
	$scope.$watch("user", function(){
		$rootScope.user = $scope.user;
	});
	
	$scope.$watch("activeHomey", function(){
		$rootScope.activeHomey = $scope.activeHomey;
	});
	
	$scope.changeActiveHomey = function( homey_id ){
		window.localStorage.activeHomey = homey_id;
		$scope.activeHomey = window.localStorage.activeHomey;
	}
	
	$rootScope.$on('header.auth.getActiveHomey', function(){
		$scope.changeActiveHomey( $scope.activeHomey );
	});
	
	if(window.localStorage.activeHomey) {
		$scope.changeActiveHomey( window.localStorage.activeHomey );
	}
	
	$scope.init = function() {
		if($scope.user == undefined) {
			if(window.localStorage.access_token && window.localStorage.refresh_token) {
				$scope.getUserInfo();
			}
		}
	};
	
	$scope.login = function() {
		$popup.open('login', $scope);
	};

	$scope.logout = function() {
		delete window.localStorage.access_token;
		delete window.localStorage.refresh_token;
		delete window.localStorage.activeHomey;
		$scope.user = undefined;
		$scope.activeHomey = undefined;
	};
	
	$scope.openMy = function() {
		window.open( window.CONFIG.paths.account );
	}
	
	$scope.getUserInfo = function() {
		$http({
			method: 'GET',
	        url: window.CONFIG.paths.apiRoot + '/user/me',
	        headers: {
	          'Authorization': 'Bearer ' + window.localStorage.access_token
	        },
	        withCredentials: true
	    })
	    .then(function(result) {		    
			if(result.status == 200) {
				$scope.user = result.data;
				
				// set first Homey as active
				if( result.data.homeys.length > 0 ) {
					$scope.changeActiveHomey( result.data.homeys[0]._id );
				}
				
			}
			else {
				$scope.refreshAccessToken();
			}
		});
	};
	
	$scope.refreshAccessToken = function() {
		$http({
			method: 'POST',
			url: window.PATH.auth.loginUrl + '/refresh',
			data: {
				refresh_token: window.localStorage.refresh_token
			}
		})
		.then(function(result) {
			if(result.status == 200) {
				if(result.data.code != 200) {
					console.log(result);
				}
				else {
					// save tokens to localStorage
					window.localStorage.access_token = result.data.accessToken;
					window.localStorage.refresh_token = result.data.refreshToken;
					$scope.getUserInfo();
				}
			}
			else {
				console.log(result);
			}
		});
	};

	$scope.goToAppManager = function() {
		var projectDir = window.localStorage.project_dir;
		var manifest = fs.readFileSync(projectDir + '/app.json', 'utf8');
		manifest = JSON.parse(manifest);
		gui.Shell.openExternal(window.CONFIG.paths.appManager + "/apps?app_id=" + manifest.id);
	};
	
	// listen for a message from the iframe
	window.addEventListener('message', function(e) {
		$scope.$apply(function() {

			// save tokens to localStorage
			window.localStorage.access_token = e.data.accessToken;
			window.localStorage.refresh_token = e.data.refreshToken;

			// hide popup
			$popup.close();

			// set userinfo
			$scope.getUserInfo();
		});
	});
}

HeaderAuthController.$inject = ['$scope', '$rootScope', '$http', '$popup'];

app.controller("HeaderAuthController", HeaderAuthController);