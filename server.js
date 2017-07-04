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

/** Data Processing **/
var cron = require('node-cron');
var request = require('request');
var async = require("async");

// Task runs every 1 hour to refresh the data in the db
cron.schedule('0 * * * * *', function(){
    console.log('running a task');
    var jsonUrl = 'https://www.reddit.com/r/videos/hot.json';
    var rawData = '';

    request({url: jsonUrl, json: true}, function (error, response, body) {
        console.log("sent request");
        if (!error && response.statusCode === 200) {
            rawData = body;
        }

        for(var i = 0; i < rawData.data.children.length; i++) {
            console.log("---------------------------------");
            var listingData = rawData.data.children[i].data;
            console.log(listingData.title);
            var embedMediaId = -1;

            // If embedded media exists for this listing then save it in the db
            if(listingData.secure_media !== null) {
                // Media Type ID setup
                var mediaTypeId = -1;
                var mediaType = {media_type: listingData.secure_media.type};
                connection.query('SELECT * FROM media_types where media_type = ?',
                    listingData.secure_media.type, function (error, results) {
                        if (results.length === 0) {
                            connection.query('INSERT INTO media_types SET ?', mediaType, function (err, result) {
                                mediaTypeId = result.insertId;
                                console.log("media type id " + result.insertId);
                            });
                        }
                        else {
                            mediaTypeId = results[0].media_type_id;
                        }
                    });

                // Embedded Media setup
                var mediaInfo = {
                    content: listingData.media_embed.content,
                    thumbnail_url: listingData.secure_media.oembed.thumbnail_url,
                    media_type_id: mediaTypeId
                };
                connection.query('INSERT INTO embedded_media SET ?', mediaInfo, function (err, result) {
                    embedMediaId = result.insertId;
                    console.log("embed media id: " + result.insertId); // FIXME: delete
                });
            }

            // Posts setup
            var postInfo  = {   post_title: listingData.title,
                                post_author: listingData.author,
                                post_image: listingData.preview.images[0].source.url,
                                embedded_media: embedMediaId,
                                permalink: listingData.permalink,
                                num_comments: listingData.num_comments
            };
            connection.query('INSERT INTO posts SET ?', postInfo, function(err, result) {
                console.log("post id: " + result.insertId);
            });
        }
    })
});

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

var server = app.listen(2500, function () {
   var host = server.address().address;
   var port = server.address().port;
   
   console.log("Server listening at http://%s:%s", host, port)
});