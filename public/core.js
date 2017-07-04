// public/core.js
var registerUser = angular.module('registerUser', []);
registerUser.controller('mainController', function($scope, $http){
    $scope.formUsernameData = {};   // Stores the username data from the user input form
    $scope.formPasswordData = {};   // Stores password data from user input form
    $scope.formEmailData = {};      // Stores email data from user input form
    $scope.registeredUsername = "";            // List stores all the results
    
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
});

var logout = angular.module('logout', []);
logout.controller('loginLogoutController', function($scope, $http){
    $scope.logoutResult = "";            // List stores all the results

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

// angular.bootstrap(document.getElementById("app2"), ['logout']); TODO: fix me