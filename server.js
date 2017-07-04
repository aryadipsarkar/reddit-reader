/** Express **/
var express = require('express');
var app = express();

/** Sessions **/
var session = require('express-session');

app.use(session({
  secret: 'cats are the best',
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 60000, secure: false }
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

/**
 * @api {post} /registerUser Registers New User
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

	connection.query('SELECT COUNT(*) as count FROM users WHERE username = ?', username, function (error, results) {
	   	if (!allFieldsFilled || results.length === 0 || results[0].count !== 0)
	   		res.sendStatus(400);
	   	else {
	   		var userInfo  = {username: username, password: password, email: email};
		   	var query = connection.query('INSERT INTO users SET ?', userInfo, function(err) {
		   		if (err) {
		   		  res.sendStatus(500);
		   		  throw err;
                }
	   			else {
					res.send('{"message": "'+username+'"}');
				}
			console.log(query.sql); //TODO: delete me after testing
			});
	   	}
   });
});

/**
 * @api {post} /login Login
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

   connection.query('SELECT password FROM users WHERE username = ?', username, function (error, results) {
   	if(results.length === 0) {
      res.sendStatus(401);
    }
    else if (results[0].password === password) {
   		console.log("checking session");
   		if(req.session && req.session.user && req.session.user === username) {

          req.session.regenerate(function() {
                console.log("after restarting the session");
                req.session.user = username;
                  res.sendStatus(200);
          });

   		}
   		else {
	   		req.session.user = username;
	   		res.sendStatus(200);
   		}
   	}
   	else
   		res.sendStatus(401)
   });
});

/**
 * @api {post} /logout Logout
 * @apiName Logout
 * @apiGroup User
 *
 * @apiSuccess {status} 200 active session exists for user
 */
app.post('/logout', function (req, res) {
	if(req.session && req.session.user) {
		req.session.destroy();
		res.sendStatus(200);
	}
	else {
		res.sendStatus(204);
	}
});

/**
 * @api {get} /getPosts Get number of posts
 * @apiName Get Posts
 * @apiGroup Reader
 *
 * @apiSuccess {String[]} last 25 most recent posts
 */
app.get('/getPosts', function (req, res) {
    connection.query('SELECT * FROM posts ORDER BY last_updated DESC LIMIT 25', function (error, results) {
        console.log("got the post request");
        if(results.length === 0) {
            res.sendStatus(204);
        }
        else
        {
            var posts = '';
            for (var i = 0; i < results.length; i++) {
                var id = results[i].post_id;
                var title = jsonCleaner(results[i].post_title);
                var author = results[i].post_author;
                var image_url = results[i].post_image;
                var link = results[i].permalink;
                var comments = results[i].num_comments;

                var has_media = results[i].has_embedded_media;
                var embedded_media = '';
                var embedded_thumb = '';
                if(has_media ===1) {
                    connection.query('SELECT * FROM embedded_media WHERE post_id = ?', id, function (error, mediaResults) {
                        if (error)
                            console.log("Error getting embedded media: " + error);

                        embedded_media = mediaResults[0].content;
                        embedded_thumb = mediaResults[0].thumbnail_url;
                    });
                }
                var postJson = '{'+
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

var server = app.listen(2500, function () {
   var host = server.address().address;
   var port = server.address().port;
   
   console.log("Server listening at http://%s:%s", host, port)
});