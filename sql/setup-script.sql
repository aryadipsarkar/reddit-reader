CREATE DATABASE reddit_reader;

CREATE TABLE users (
  user_id int(11) NOT NULL AUTO_INCREMENT,
  username varchar(25),
  password varchar(12), -- min should be 8 and max should be 12
  email varchar(100), -- validate that it has an @ in it
  PRIMARY KEY (user_id)
) DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE posts (
  post_id varchar(20) NOT NULL,
  post_title varchar(1000),
  post_author varchar(20), -- reddit username max is 20
  post_image varchar(250), -- all start with https://i.redditmedia.com/
  has_embedded_media boolean default false,
  permalink varchar(100),
  num_comments varchar(100),
  last_updated datetime,
  PRIMARY KEY (post_id)
);

CREATE TABLE starred_posts (
    user_id int(11),
    post_id varchar(20),
    PRIMARY KEY (user_id, post_id),
    UNIQUE INDEX (user_id, post_id),
    foreign key (user_id) references users(user_id),
    foreign key (post_id) references posts(post_id)
);

CREATE TABLE embedded_media (
  media_id int(11) NOT NULL AUTO_INCREMENT,
  content varchar(1000),
  thumbnail_url varchar(500), -- all start with https://i.redditmedia.com/
  post_id varchar(20),
  PRIMARY KEY (media_id)
) DEFAULT CHARSET=utf8 AUTO_INCREMENT=2;