// public/core.js
var registerUser = angular.module('registerUser', []);
registerUser.controller('mainController', function($scope, $http){
    $scope.formUsernameData = {};       // Stores the username data from the user input form
    $scope.formPasswordData = {};       // Stores password data from user input form
    $scope.formEmailData = {};          // Stores email data from user input form
    $scope.registeredUsername = "";     // Stores the username

    /** Register a new user **/
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
login.controller('loginController', function($scope, $http) {
    /** Log a user in **/
    $scope.formUsernameData = {};   // Stores the username data from the user input form
    $scope.formPasswordData = {};   // Stores password data from user input form
    $scope.result = "";             // Stores all the result
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

var reader = angular.module('reader', []);
reader.controller('readController', function($scope, $http) {
    /** Get posts from the db**/
    $scope.getPosts = function () {
        $http.get('/getPosts')
            .success(function (data, status) {
                $scope.posts = [];      // List of every post returned from the server
                $scope.rawPosts = data.message;
                // If there is content returned, store it in posts as a manageable list and future
                // processing that may need to be done.
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

    /** Set a post as a favorite in the db **/
    $scope.starPost = function (post_id) {
        var starredPostJson = '{"id":"' + post_id + '"}';   // Sends the id of the starred post to send to the server
        $http.post('/setFavorite', starredPostJson)
            .success(function (data, status) {
                console.log(status);
            })
            .error(function (error) {
                console.log('Error: ' + error.message);
            });
    };

    /** Return all the starred posts from the db**/
    $scope.getStarredPosts = function () {
        $http.get('/getFavorites')
            .success(function (data, status) {
                $scope.starredPosts = [];   // Stores all the starred posts returned from the server
                $scope.rawStarredPosts = data.ids;
                // If there is content returned, store it in posts as a manageable list and future
                // processing that may need to be done.
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

    /** Get all the posts **/
    // Bundle all the post functions into one so that they can be initialized at once
    $scope.getAllPosts = function(){
        $scope.getPosts();
        $scope.getStarredPosts();
    };

    /** Log the user out **/
    $scope.logoutResult = "";
    $scope.logout = function() {
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
