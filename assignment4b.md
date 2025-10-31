# Assignment 4b

## Links to deliverables

[Visual design study](./media/Visual%20design%20study.pdf)

[Recording, no sound](./media/Screen%20Recording%202025-10-31%20at%204.54.57 PM.mov)

## User journey

The user logs into their account and uploads a new file that they want the generator to use—like an updated resume they want the generator to use for context. They then go to their job tracker and add a new entry for the job that they're applying to and delete an old one that is no longer relevant (maybe they rejected the offer). After having updated their job tracker and files, they go to the job application question generator and enter the question that they need to write up (cover letter for microsoft software dev) and then read over the draft before accepting it and being taken to the pdf download page, where they can download the polished cover letter ready for submission..

## Updates to design

- Finally added ai generator concept and made it work
- Also fixed bugs in job tracker
- Changed generator to no longer have an accept function, since that was blocking future generation of prompts (this was because the accept was originally written with the hope of having multipel question prompts open at the same time)
- Added a pdf download page
- Started changing the color scheme from the default vue purple, but still have some things to be done, I'm working on fixing the UX aand so the file uploader is still a little bit weird, but I really want it to be something cutesy even though that sort of goes against the general productivity vibe of the app.
