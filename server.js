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
 * @api {post} /getPosts Get number of posts
 * @apiName Logout
 * @apiGroup User
 *
 * @apiSuccess {status} 200 active session exists for user
 */
app.post('/getPosts', function (req, res) {
    var postLimit = req.body.post_limit;

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

var server = app.listen(2500, function () {
   var host = server.address().address;
   var port = server.address().port;
   
   console.log("Server listening at http://%s:%s", host, port)
});