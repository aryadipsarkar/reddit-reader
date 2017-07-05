/** Express **/
var express = require('express');
var app = express();

/** Sessions **/
var session = require('express-session');

app.use(session({
  secret: 'cats are the best',
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 600000, secure: false } // Session lasts for 10 min
}));

/** MySQL **/
var mysql = require('mysql');
var options = {
 	host     : 'localhost',
  	user     : 'root',
  	database : 'reddit_reader'
};
var connection = mysql.createConnection(options);

/** Body Parser **/
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

/** Serve **/
var serveStatic = require('serve-static');
app.use(serveStatic('./public', {'index': ['index.html', 'index.htm']}));

/** Helper functions **/
var jsonCleaner = require('./helpers/json-cleaner');
var convertToHtml = require('./helpers/json-to-html');

/**
 * @api {post} /registerUser Registers new user
 * @apiName RegisterUser
 * @apiGroup User
 *
 * @apiParam {username} unique username
 * @apiParam {password} any password
 * @apiParam {email} registered email
 *
 * @apiSuccess {String} username of the successfully registered user
 */
app.post('/registerUser', function (req, res) {
   	var username = req.body.username;
   	var password = req.body.password;
    var email = req.body.email;
   	var allFieldsFilled = email && username && password;

   	// Check to make sure the username is not already registered and that all the fields are filled
	connection.query('SELECT COUNT(*) as count FROM users WHERE username = ?', username, function (error, results) {
	   	if (!allFieldsFilled || results.length === 0 || results[0].count !== 0)
	   		res.sendStatus(400);
	   	else {
	   	    // Insert a new user record into the db
	   		var userInfo  = {username: username, password: password, email: email};
		   	connection.query('INSERT INTO users SET ?', userInfo, function(err) {
		   		if (err) {
		   		  res.sendStatus(500);
		   		  throw err;
                }
	   			else {
					res.send('{"message": "'+username+'"}');
				}
			});
	   	}
   });
});

/**
 * @api {post} /login Logs a user in
 * @apiName Login
 * @apiGroup User
 *
 * @apiParam {username} login username
 * @apiParam {password} corresponding login password
 *
 * @apiSuccess {status} 200 password matches the password stored in the db for this user
 */
app.post('/login', function (req, res) {
   var username = req.body.username;
   var password = req.body.password;

   // Check to make sure the username is not already registered and that all the password is filled out
   connection.query('SELECT password FROM users WHERE username = ?', username, function (error, results) {
   	if(!password || results.length === 0) {
      res.sendStatus(401);
    }
    // Check that the passwords match
    else if (results[0].password === password) {
   		console.log("checking session");

   		// If there is already an active session for this user, then regenerate a new session
   		if(req.session && req.session.user && req.session.user === username) {
          req.session.regenerate(function() {
                console.log("restarting the session");
                req.session.user = username;    // Set the username on the session
                  res.sendStatus(200);
          });

   		}
   		// Must repeat this in the else block in order for the regenerate() function to work
   		else {
	   		req.session.user = username;
	   		res.sendStatus(200);
   		}
   	}
   	// If the passwords do not match, then send a 401 http status
   	else
   		res.sendStatus(401)
   });
});

/**
 * @api {post} /logout Logs a user out
 * @apiName Logout
 * @apiGroup User
 *
 * @apiSuccess {status} 200 active session exists for user
 */
app.post('/logout', function (req, res) {
    console.log("got logout request");
    // Destroy the session if the user has an active session
	if(req.session && req.session.user) {
		req.session.destroy();
		res.sendStatus(200);
	}
	// Send a no content status if the user is trying to log out and not logged in
	else {
		res.sendStatus(204);
	}
});

/**
 * @api {get} /getPosts Returns the number of posts
 * @apiName Get Posts
 * @apiGroup Reader
 *
 * @apiSuccess {String[]} last 25 most recent posts
 */
app.get('/getPosts', function (req, res) {
    // Query for only all the relevant column values needed from the posts table (merged with embedded media)
    connection.query('SELECT p.post_id as post_id, p.post_title as post_title, p.post_author as post_author, ' +
        'p.post_image as post_image, p.permalink as permalink, p.num_comments as num_comments, ' +
        't1.content as content, t1.thumbnail_url as thumbnail_url ' +
        'FROM posts p ' +
        'LEFT JOIN (SELECT * FROM embedded_media WHERE thumbnail_url NOT LIKE \'https://i.embed.ly/1/image%\') t1 ' +
        'ON t1.post_id = p.post_id ' +
        'ORDER BY p.last_updated DESC, p.post_id desc LIMIT 25', function (error, results) {
        console.log("got the getPosts post request");

        // If there are no posts returned, then send a no content 204 status
        if(results.length === 0) {
            res.sendStatus(204);
        }
        // Otherwise, bundle the results into objects to include as the JSON blurb sent to clients
        else
        {
            var posts = '';
            for (var i = 0; i < results.length; i++) {
                var post_id = results[i].post_id;
                var title = jsonCleaner(results[i].post_title);
                var author = results[i].post_author;
                var image_url = results[i].post_image;
                var link = results[i].permalink;
                var comments = results[i].num_comments;
                var embedded_media = convertToHtml(jsonCleaner(results[i].content));
                var embedded_thumb = results[i].thumbnail_url;
                var postJson = '{"id":"'+ post_id + '",'+
                    '"title":"' + title + '",' +
                    '"author":"' + author + '",' +
                    '"image_url":"' + image_url + '",' +
                    '"link":"' + link + '",' +
                    '"num_comments":"' + comments + '",' +
                    '"media_html":"' + embedded_media + '",' +
                    '"media_thumbnail":"' + embedded_thumb + '"' +
                    '}';
                posts = posts.concat(postJson);
                if (i !== results.length - 1)
                    posts = posts.concat(",");
            }
            res.send('{"message":[' + posts + ']}');
        }
    });
});

/**
 * @api {post} /setFavorite Sets a post as a favorite post for a specific user
 * @apiName Set Favorite
 * @apiGroup favorites
 *
 * @apiSuccess {status} 200 user has an account
 */
app.post('/setFavorite', function (req, res) {
    var postId = req.body.id;
    // Inserts a new mapping between the current user and the post whose post id was sent
    if(req.session && req.session.user) {
        connection.query('SELECT user_id FROM users where username = ?;', req.session.user, function (error, userIdResults) {
            connection.query('INSERT INTO starred_posts set user_id = ?, post_id = ?;', [userIdResults[0].user_id, postId], function (error, results) {
                if (error) {
                    console.log(error);
                    res.sendStatus(400);
                }
                else {
                    res.sendStatus(200);
                }
            });
        });
    }
    else {
        console.log('no user');
        res.sendStatus(204);
    }
});

/**
 * @api {get} /getFavorites Returns all favorites
 * @apiName Get favorites
 * @apiGroup favorites
 *
 * @apiSuccess {list} ids a list of starred ids
 */
app.get('/getFavorites', function (req, res) {
    console.log('Get favorites');
    // Receiving all favorites for this specific user
    if(req.session && req.session.user) {
        connection.query('SELECT user_id FROM users where username = ?;', req.session.user, function (error, userIdResults) {
            connection.query('SELECT * FROM starred_posts where user_id = ?;', userIdResults[0].user_id, function (error, favPosts) {
                if (error) {
                    console.log(error);
                    res.sendStatus(400);
                }
                // Did not get any results
                else if(favPosts.length === 0) {
                    console.log('No content');
                    res.sendStatus(204);
                }
                // Prepare all the favorited posts to be sent back to client as a list of ids
                else {
                    var starredPosts = '';
                    for (var i = 0; i < favPosts.length; i++) {
                        var post_id = '"'+favPosts[i].post_id+'"';
                        starredPosts = starredPosts.concat(post_id);

                        if (i !== favPosts.length - 1)
                            starredPosts = starredPosts.concat(",");
                    }
                    console.log('starred:' + starredPosts);
                    res.send('{"ids":[' + starredPosts + ']}');
                }
            });
        });
    }
    // No active session exists for the current user
    else {
        console.log('no user');
        res.sendStatus(204);
    }
});

// Listening on port 2500
var server = app.listen(2500, function () {
   var host = server.address().address;
   var port = server.address().port;
   
   console.log("Server listening at http://%s:%s", host, port)
});