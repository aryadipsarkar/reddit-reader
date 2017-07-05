# easecentral-challenge

How to run locally:
(Prereqs: nodejs and mysql should be installed)
1. Run the setup script under /sql in mysql to setup the db
2. node data-processing-module.js to start the data processing module. It may take up to 5 minutes for the data
to start pulling and populate the db (this is the way the cron job is setup).
3. node server.js to start the server

Notes:
- Database portion of the prject is under /database_portion
- The favoriting is not working on AWS which I think has to do with my minimal implementation of session management
- There were some encoding issues that came up in the titles which I didn't take the time to look into
- There should be a foreign key from posts to embedded_media and enumerate media_type, but due to my limited Node
skills and limited time, I did not make a media_type table and post_id is populated independently
- For now, I'm assuming that we only have one embedded media row for each post
- I did not have time to figure out how to use the embed.ly API so discarded the thumbnails using embed.ly
- I ordered by primary key on posts when retrieving them for the front end just as a workaround; I did this to create
deterministic results, since the last_updated date is not granular enough.
- It would be a better user experience to use a sticky header
- I did not implement a full authentication feature. You can easily still use the reader without logging in.
- This repo includes the local version of the code. Configurations are different for AWS
