# Assignment 4a Design File


## Not-so-helpful interesting things

[Context reference](./context/design/concepts/UserAuthentication/Testing.md/steps/response.7b9096fa.md)

- The tests produced would hallucinate output formatting (it would assume that the output for the user was always going to start with 'user', which was something I had never mentioned but seemed reasonable to hallucinate) and make assumptions (which is fine, this is something I would do too)

- The AI does a weird thing where it returns error: string instead of failed promises (this is less fine, since it misunderstands what a promise is supposed to do), and I had to repetitively correct it to use reject promises instead of error strings.

- A strange error message occurred for my UserAuthentication test that were not experienced by other tests because it magically started hallucinating that there existed a Deno.afterAll(), even though other tests were fine, which caused the mongodb connection to not be closed.

```
error: Leaks detected:
  - 4 async calls to op_read were started in this test, but never completed.
  - 9 timers were started in this test, but never completed. This is often caused by not calling `clearTimeout`.
  - A TLS connection was opened/accepted during the test, but not closed during the test. Close the TLS connection by calling `tlsConn.close()`.
To get more details where leaks occurred, run again with the --trace-leaks flag
```

[Context link](./context/design/concepts/JobTracker/Implementation.md/steps/response.559ae5f1.md)

- I also found the AI functioned better when I cleared all previous responses, otherwise it was very stubborn in adhering to previous responses. In particular, I was trying to combine add and create for Job Tracker, since adding a job to the user account and creating a job under the user account was splitting up a function that didn't need to be split up, but the AI was refusing to abandon the old spec that I had before.


## Helpful Interesting things

[Context Reference](./context/design/concepts/JobTracker/Implementation.md/steps/response.ddd03721.md )

- The ai gave feedback on concept input, for my JobTracker concept during implementation, even though I did not ask for feedback. I realized that I had a redudnant add + create function, that were always going to act together, so I saw no reason to separate them. I also realized it would be good to have a function that returns all jobs under a user. Overall the tool was helpful in this sense, as it helped me re-evaluate my concept specs. 

## Changes made:

- Added a new concept - [job tracker spec](./design/concepts/JobTracker)
- Added a new concept -[user authentication concept](./design/concepts/UserAuthentication)
- Modified [FileStorage](./design/concepts/FileStorage) concept to encompass the user, since the user authentication is a new concept 
- Removed an old concept - PDFDownloader - this was because I was discussing my concepts with a TA , and they said that PDFDownload could be handled with an imported library
 

## Console output for tests
```
FileStorageConcept ...
  should successfully upload a file for a user ... ok (117ms)
  should prevent uploading a file with an existing name for the same user ... ok (114ms)
  should successfully remove an existing file for a user ... ok (113ms)
  should prevent removing a non-existent file for a user ... ok (31ms)
  should successfully rename an existing file for a user ... ok (119ms)
  should prevent renaming a non-existent file for a user ... ok (32ms)
  should prevent renaming a file to an already existing name for the same user ... ok (122ms)
  should return all files for a specific user using the _files query ... ok (31ms)
  principle: files provide context for generator and can be removed ... ok (314ms)
FileStorageConcept ... ok (1s)
running 1 test from ./src/concepts/JobTracker/JobTrackerConcept.test.ts
JobTracker Concept Tests ...
  should initialize with an empty state ... ok (20ms)
  add: should successfully add a new job ... ok (81ms)
  add: should throw an error when adding a duplicate job for the same user ... ok (47ms)
  add: should allow adding the same job details for a different user ... ok (72ms)
  add: should allow adding multiple distinct jobs for the same user ... ok (52ms)
  remove: should successfully remove an existing job by the owner ... ok (76ms)
  remove: should throw an error when removing a non-existent job ... ok (17ms)
  remove: should throw an error when a user tries to remove another user's job ... ok (94ms)
  update: should successfully update an existing job ... ok (76ms)
  update: should return successfully even if no data actually changes ... ok (34ms)
  update: should throw an error when updating a non-existent job ... ok (17ms)
  update: should throw an error when a user tries to update another user's job ... ok (83ms)
  getJobs: should retrieve all jobs for a specific user ... ok (55ms)
  getJobs: should return an empty array for a user with no jobs ... ok (18ms)
  getJobs: should correctly separate jobs by user ... ok (34ms)
  Principle Trace: User adds, tracks, and then updates or removes a job ... ok (166ms)
JobTracker Concept Tests ... ok (1s)
running 5 tests from ./src/concepts/LikertSurvey/LikertSurveyConcept.test.ts
Principle: Author creates survey, respondent answers, author views results ... ok (954ms)
Action: createSurvey requires scaleMin < scaleMax ... ok (452ms)
Action: addQuestion requires an existing survey ... ok (485ms)
Action: submitResponse requirements are enforced ... ok (844ms)
Action: updateResponse successfully updates a response and enforces requirements ... ok (874ms)
running 1 test from ./src/concepts/UserAuthentication/UserAuthenticationConcept.test.ts
UserAuthenticationConcept tests ...
  register: successfully creates a new user ...
------- post-test output -------
aliceId: 0199ef19-c59a-71bc-b517-d3946ad90af0
----- post-test output end -----
  register: successfully creates a new user ... ok (76ms)
  register: prevents registration with existing username (requires) ... ok (61ms)
  authenticate: successfully authenticates an existing user (effects) ... ok (48ms)
  authenticate: fails with incorrect password (requires) ... ok (50ms)
  authenticate: fails with non-existent username (requires) ... ok (16ms)
  Principle trace: User registration and subsequent authentication ...
------- post-test output -------
TRACE: Attempting to register user 'eve'...
TRACE: Successfully registered user Eve with ID: 0199ef19-c697-72fc-b876-6966df459481
TRACE: Attempting to authenticate user 'eve'...
TRACE: Successfully authenticated user Eve with ID: 0199ef19-c697-72fc-b876-6966df459481
TRACE: Principle fulfilled: Eve successfully registered and authenticated as the same user.
----- post-test output end -----
  Principle trace: User registration and subsequent authentication ... ok (50ms)
UserAuthenticationConcept tests ... ok (747ms)

ok | 8 passed (31 steps) | 0 failed (7s)
```
