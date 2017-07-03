CREATE DATABASE reddit_reader;

CREATE TABLE users (
  user_id int(11) NOT NULL AUTO_INCREMENT,
  username varchar(25),
  password varchar(12), -- min should be 8 and max should be 12
  email varchar(100), -- validate that it has an @ in it
  PRIMARY KEY (user_id)
) DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

--INSERT INTO users (id, username, password, first_name, last_name, address, city, state, zip, email, is_admin) VALUES
--(100, 'jadmin', 'admin', 'Jenny', 'Admin', '1234 Main Street', 'Seattle', 'WA', '98105', 'hello@amazon.com', 1);

CREATE TABLE posts (
  post_id int(11) NOT NULL AUTO_INCREMENT,
  post_title varchar(250),
  post_author varchar(20), -- reddit username max is 20
  post_image varchar(250), -- all start with https://i.redditmedia.com/
  embedded_media varchar(100),
  permalink varchar(100),
  num_comments varchar(100),
  PRIMARY KEY (post_id)
) DEFAULT CHARSET=utf8 AUTO_INCREMENT=5;

CREATE TABLE starred_posts (
    user_id int(11),
    post_id int(11),
    PRIMARY KEY (user_id, post_id),
    UNIQUE INDEX (user_id, post_id),
    foreign key (user_id) references users(user_id),
    foreign key (post_id) references posts(post_id)
);

CREATE TABLE embedded_media (
  media_id int(11) NOT NULL AUTO_INCREMENT,
  content varchar(1000),
  thumbnail_url varchar(250), -- reddit username max is 20
  media_type_id varchar(250), -- all start with https://i.redditmedia.com/
  PRIMARY KEY (media_id)
) DEFAULT CHARSET=utf8 AUTO_INCREMENT=2;

CREATE TABLE media_types (
  media_type_id int(11) NOT NULL AUTO_INCREMENT,
  media_type varchar(25),
  PRIMARY KEY (media_type_id)
) DEFAULT CHARSET=utf8 AUTO_INCREMENT=2;