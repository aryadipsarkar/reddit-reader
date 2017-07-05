// public/core.js
var registerUser = angular.module('registerUser', []);
registerUser.controller('mainController', function($scope, $http){
    $scope.formUsernameData = {};       // Stores the username data from the user input form
    $scope.formPasswordData = {};       // Stores password data from user input form
    $scope.formEmailData = {};          // Stores email data from user input form
    $scope.registeredUsername = "";     // List stores all the results
    
    $scope.registerUser = function() {
        var userJson = '{' +
            '"username":"'+$scope.formUsernameData.text+'",' +
            '"password":"'+$scope.formPasswordData.text+'",' +
            '"email":"'+$scope.formEmailData.text+'"}';

        $http.post('/registerUser', userJson)
            .success(function(data) {
                // Clear the form after entering
                $scope.formUsernameData = {};
                $scope.formPasswordData = {};
                $scope.formEmailData = {};

                $scope.registeredUsername = data.message;
            })
            .error(function(data, status) {
                if(status === 500 || status === 400)
                    $scope.registeredUsername = "error";
            });
    };
});

var login = angular.module('login', []);
login.controller('loginLogoutController', function($scope, $http){
    $scope.formUsernameData = {};   // Stores the username data from the user input form
    $scope.formPasswordData = {};   // Stores password data from user input form
    $scope.result = "";            // List stores all the results
    $scope.login = function() {
        var userJson = '{' +
            '"username":"'+$scope.formUsernameData.text+'",' +
            '"password":"'+$scope.formPasswordData.text+'"}';

        $http.post('/login', userJson)
            .success(function(data, status) {
                // Clear the form after entering
                $scope.formUsernameData = {};
                $scope.formPasswordData = {};

                if(status === 200)
                    $scope.result = "OK";
            })
            .error(function(data, status) {
                if(status === 401)
                    $scope.result = "error";
            });
    };

    $scope.logoutResult = "";
    $scope.login = function() {
        $http.post('/logout', "")
            .success(function(data, status) {
                if(status === 200)
                    $scope.logoutResult = "OK";
            })
            .error(function(data, status) {
                if(status === 204)
                    $scope.logoutResult = "error";
            });
    };
});

var reader = angular.module('reader', []);
reader.controller('readController', function($scope, $http) {
    $scope.getPosts = function () {
        $http.get('/getPosts')
            .success(function (data, status) {
                $scope.posts = [];
                $scope.rawPosts = data.message;
                if (status !== 204) {
                    for (var i = 0; i < $scope.rawPosts.length; i++) {
                        $scope.posts.push($scope.rawPosts[i]);
                    }
                }
            })
            .error(function (error) {
                $scope.posts.push("ERROR");
                console.log('Error: ' + error.message);
            });
    };

    $scope.starPost = function (post_id) {
        var starredPostJson = '{"id":"' + post_id + '"}';
        $http.post('/setFavorite', starredPostJson)
            .success(function (data, status) {
                console.log(status);
            })
            .error(function (error) {
                console.log('Error: ' + error.message);
            });
    };

    $scope.getStarredPosts = function () {
        $http.get('/getFavorites')
            .success(function (data, status) {
                $scope.starredPosts = [];
                $scope.rawStarredPosts = data.ids;
                if (status !== 204 && status !== 400) {
                    for (var i = 0; i < $scope.rawStarredPosts.length; i++) {
                        $scope.starredPosts.push($scope.rawStarredPosts[i]);
                    }
                }
            })
            .error(function (error) {
                console.log('Error: ' + error.message);
            });
    };

    $scope.getAllPosts = function(){
        $scope.getPosts();
        $scope.getStarredPosts();
    };
});
