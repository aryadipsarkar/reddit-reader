# easecentral-challenge
Notes:
- There were some encoding issues that came up in the titles which I didn't take the time to look into
- There should be a foreign key from posts to embedded_media and enumerate media_type, but due to my limited Node
skills and limited time, I did not make a media_type table and post_id is populated independently
- For now, I'm assuming that we only have one embedded media row for each post
- I did not have time to figure out how to use the embed.ly API so discarded the thumbnails using embed.ly
- I ordered by primary key on posts when retrieving them for the front end just as a workaround; I did this to create
deterministic results, since the last_updated date is not granular enough.
- It would be a better user experience to use a sticky header
- I did not implement a full authentication feature. You can easily still use the reader without logging in.
