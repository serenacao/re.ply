# Design document

. Turn your design notes (recording your ideas, changes, and observations) into a coherent document of one to two pages in length that summarizes how your final design differs from your initial concept design in Assignment 2 and your visual design in Assignment 4b. Be succinct and to the point, and use bullets and subheadings to make it easy to navigate. Feel free to use diagrams and screenshots to illustrate your points if helpful. To refer to particular versions of concept specifications and prompts, use links to the immutable snapshots.

4a

- Added a new concept - [job tracker spec](./design/concepts/JobTracker)
- Added a new concept -[user authentication concept](./design/concepts/UserAuthentication)
- Modified [FileStorage](./design/concepts/FileStorage) concept to encompass the user, since the user authentication is a new concept 
- Removed an old concept - PDFDownloader - this was because I was discussing my concepts with a TA , and they said that PDFDownload could be handled with an imported library


4b

- Finally added ai generator concept and made it work
- Also fixed bugs in job tracker
- Changed generator to no longer have an accept function, since that was blocking future generation of prompts (this was because the accept was originally written with the hope of having multipel question prompts open at the same time)
- Added a pdf download page
- Started changing the color scheme from the default vue purple, but still have some things to be done, I'm working on fixing the UX aand so the file uploader is still a little bit weird, but I really want it to be something cutesy even though that sort of goes against the general productivity vibe of the app.


4c
- continue to change color + font + etc, i made the font more thin, decreased the number of colors on some pages, 
- expanded job tracker table (hopefully)
- had changed generator concept to instead take in an LLM in the constructor instead of passing it into every api call
- update user authetnication concept after authentication to return a time sensitive token associated with the user 


