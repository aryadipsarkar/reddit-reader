/** MySQL **/
var mysql = require('mysql');
var options = {
    host     : 'localhost',
    user     : 'root',
    database : 'reddit_reader'
};
var connection = mysql.createConnection(options);

/** Data Processing **/
var cron = require('node-cron');
var request = require('request');

// Task runs every 5 minutes to refresh the data in the db
cron.schedule('*/5 * * * *', function() {
    console.log('refreshing content...');
    var jsonUrl = 'https://www.reddit.com/r/videos/hot.json'; // hot.json wasn't working so I picked a random subreddit
    var rawData = '';

    request({url: jsonUrl, json: true}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            rawData = body;
        }
        // For each listing we get from reddit, store the data in the db
        rawData.data.children.forEach(function(child) {
            var listingData = child.data;

            // If embedded media exists for this listing then save it in the db
            if (listingData.secure_media !== null) {
                /** Embedded Media setup **/
                var mediaInfo = {
                    content: listingData.media_embed.content,
                    thumbnail_url: listingData.secure_media.oembed.thumbnail_url,
                    post_id: listingData.id
                };
                // Insert embedded_media if it doesn't already exist. If it does, just update the record
                connection.query('SELECT * FROM embedded_media where post_id = ?', listingData.id, function (err, results) {
                    if (results.length === 0) {
                        connection.query('INSERT INTO embedded_media SET ?', mediaInfo, function (err) {
                            if (err)
                                console.log("error inserting into embedded_media: " + err);
                        });
                    }
                    else {
                        connection.query('UPDATE embedded_media SET ? WHERE post_id = ?', [mediaInfo, listingData.id], function (err) {
                            if (err)
                                console.log("error updating an embedded_media: " + err);
                        });
                    }
                });
            }

            /** Posts setup **/
            var postInfo  = {   post_id: listingData.id,
                                post_title: listingData.title,
                                post_author: listingData.author,
                                post_image: (listingData.preview ? listingData.preview.images[0].source.url : null),
                                has_embedded_media: (listingData.secure_media !== null),
                                permalink: listingData.permalink,
                                num_comments: listingData.num_comments,
                                last_updated: new Date()
            };
            // Insert the post if it doesn't already exist. If it does, just update the record
            connection.query('SELECT * FROM posts where post_id = ?', listingData.id, function (error, results) {
                if (results.length === 0) {
                    connection.query('INSERT INTO posts SET ?', postInfo, function(err, result) {
                        if (err)
                            console.log("error inserting into posts: " + err);
                    });
                }
                else {
                    connection.query('UPDATE posts SET ? WHERE post_id = ?', [postInfo, listingData.id], function (err, result) {
                        if (err)
                            console.log("error updating a post: " + err);
                    });
                }
            });
        });
    })
});