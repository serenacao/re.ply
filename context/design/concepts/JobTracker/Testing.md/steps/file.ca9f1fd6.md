---
timestamp: 'Thu Oct 16 2025 18:14:45 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_181445.f965ab70.md]]'
content_id: ca9f1fd67d4693348032ec8cfa1cd553723634a474a568f3282a302ccda1d021
---

# file: src/JobTracker/JobTrackerConcept.test.ts

```typescript
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { testDb } from "@utils/database.ts"; // Assuming testDb is correctly exported from here
import JobTrackerConcept from "./JobTrackerConcept.ts";

// Define a test user and some job details
const USER_ALICE: ID = "user:Alice" as ID;
const USER_BOB: ID = "user:Bob" as ID;

const JOB_1_POS = "Software Engineer";
const JOB_1_COMP = "Google";
const JOB_1_STATUS = "pending";

const JOB_2_POS = "Product Manager";
const JOB_2_COMP = "Microsoft";
const JOB_2_STATUS = "accepted";

const JOB_3_POS = "UX Designer";
const JOB_3_COMP = "Apple";
const JOB_3_STATUS = "rejected";

Deno.test("JobTracker Concept Tests", async (test) => {
  const [db, client] = await testDb();
  const jobTracker = new JobTrackerConcept(db);

  await test.step("should initialize with an empty state", async () => {
    const { jobs } = await jobTracker.getJobs({ user: USER_ALICE });
    assertEquals(jobs.length, 0);
  });

  await test.step("add: should successfully add a new job", async () => {
    const { job: job1Id } = await jobTracker.add({
      user: USER_ALICE,
      position: JOB_1_POS,
      company: JOB_1_COMP,
      status: JOB_1_STATUS,
    });
    assertEquals(typeof job1Id, "string"); // Check if an ID was returned

    const { jobs } = await jobTracker.getJobs({ user: USER_ALICE });
    assertEquals(jobs.length, 1);
    assertEquals(jobs[0].userId, USER_ALICE);
    assertEquals(jobs[0].position, JOB_1_POS);
    assertEquals(jobs[0].company, JOB_1_COMP);
    assertEquals(jobs[0].status, JOB_1_STATUS);
    assertEquals(jobs[0]._id, job1Id);
  });

  await test.step("add: should throw an error when adding a duplicate job for the same user", async () => {
    // Attempt to add the same job for Alice again
    await assertRejects(
      () =>
        jobTracker.add({
          user: USER_ALICE,
          position: JOB_1_POS,
          company: JOB_1_COMP,
          status: JOB_1_STATUS,
        }),
      Error,
      `Job for position '${JOB_1_POS}' at company '${JOB_1_COMP}' already exists for user '${USER_ALICE}'.`,
    );

    // Ensure state hasn't changed (still only one job for Alice)
    const { jobs } = await jobTracker.getJobs({ user: USER_ALICE });
    assertEquals(jobs.length, 1);
  });

  await test.step("add: should allow adding the same job details for a different user", async () => {
    const { job: job1BobId } = await jobTracker.add({
      user: USER_BOB,
      position: JOB_1_POS,
      company: JOB_1_COMP,
      status: JOB_1_STATUS,
    });
    assertEquals(typeof job1BobId, "string");

    const { jobs: aliceJobs } = await jobTracker.getJobs({ user: USER_ALICE });
    assertEquals(aliceJobs.length, 1); // Alice still has only her job

    const { jobs: bobJobs } = await jobTracker.getJobs({ user: USER_BOB });
    assertEquals(bobJobs.length, 1); // Bob has his job
    assertEquals(bobJobs[0].userId, USER_BOB);
    assertEquals(bobJobs[0].position, JOB_1_POS);
    assertEquals(bobJobs[0].company, JOB_1_COMP);
    assertEquals(bobJobs[0].status, JOB_1_STATUS);
    assertEquals(bobJobs[0]._id, job1BobId);
  });

  let aliceJob2Id: ID;
  await test.step("add: should allow adding multiple distinct jobs for the same user", async () => {
    const { job: newJobId } = await jobTracker.add({
      user: USER_ALICE,
      position: JOB_2_POS,
      company: JOB_2_COMP,
      status: JOB_2_STATUS,
    });
    aliceJob2Id = newJobId; // Store for later tests

    const { jobs } = await jobTracker.getJobs({ user: USER_ALICE });
    assertEquals(jobs.length, 2); // Alice now has two jobs
    const jobPositions = jobs.map((j) => j.position);
    assertEquals(jobPositions.includes(JOB_1_POS), true);
    assertEquals(jobPositions.includes(JOB_2_POS), true);
  });

  await test.step("remove: should successfully remove an existing job by the owner", async () => {
    // First, ensure Alice has the job we're about to remove
    const { jobs: aliceJobsBeforeRemove } = await jobTracker.getJobs({ user: USER_ALICE });
    const jobToRemove = aliceJobsBeforeRemove.find(j => j._id === aliceJob2Id);
    assertEquals(!!jobToRemove, true, "Job to remove should exist before removal");

    // Perform removal
    const { job: removedJobId } = await jobTracker.remove({
      user: USER_ALICE,
      job: aliceJob2Id,
    });
    assertEquals(removedJobId, aliceJob2Id);

    // Verify it's gone
    const { jobs: aliceJobsAfterRemove } = await jobTracker.getJobs({ user: USER_ALICE });
    assertEquals(aliceJobsAfterRemove.length, 1); // Alice now has only one job left
    assertEquals(
      aliceJobsAfterRemove.some((j) => j._id === aliceJob2Id),
      false,
    );
  });

  await test.step("remove: should throw an error when removing a non-existent job", async () => {
    const nonExistentJobId = "job:nonexistent" as ID;
    await assertRejects(
      () => jobTracker.remove({ user: USER_ALICE, job: nonExistentJobId }),
      Error,
      `Job with ID '${nonExistentJobId}' not found for user '${USER_ALICE}' or not owned by them.`,
    );
  });

  await test.step("remove: should throw an error when a user tries to remove another user's job", async () => {
    // Get Bob's job ID
    const { jobs: bobJobs } = await jobTracker.getJobs({ user: USER_BOB });
    const bobJobId = bobJobs[0]._id;

    await assertRejects(
      () => jobTracker.remove({ user: USER_ALICE, job: bobJobId }), // Alice tries to remove Bob's job
      Error,
      `Job with ID '${bobJobId}' not found for user '${USER_ALICE}' or not owned by them.`,
    );

    // Ensure Bob's job still exists
    const { jobs: bobJobsAfterAttempt } = await jobTracker.getJobs({ user: USER_BOB });
    assertEquals(bobJobsAfterAttempt.length, 1);
  });

  let aliceJob1Id: ID;
  await test.step("update: should successfully update an existing job", async () => {
    // Get Alice's remaining job ID (the first one added)
    const { jobs: aliceJobs } = await jobTracker.getJobs({ user: USER_ALICE });
    assertEquals(aliceJobs.length, 1);
    aliceJob1Id = aliceJobs[0]._id;

    const newPosition = "Senior Software Engineer";
    const newStatus = "interviewing";

    const { job: updatedJobId } = await jobTracker.update({
      user: USER_ALICE,
      job: aliceJob1Id,
      position: newPosition,
      company: JOB_1_COMP, // Company remains the same
      status: newStatus,
    });
    assertEquals(updatedJobId, aliceJob1Id);

    const { jobs: updatedAliceJobs } = await jobTracker.getJobs({ user: USER_ALICE });
    assertEquals(updatedAliceJobs.length, 1);
    assertEquals(updatedAliceJobs[0].position, newPosition);
    assertEquals(updatedAliceJobs[0].company, JOB_1_COMP);
    assertEquals(updatedAliceJobs[0].status, newStatus);
    assertEquals(updatedAliceJobs[0]._id, aliceJob1Id);
  });

  await test.step("update: should return successfully even if no data actually changes", async () => {
    // Update with the same data again
    const { job: updatedJobId } = await jobTracker.update({
      user: USER_ALICE,
      job: aliceJob1Id,
      position: "Senior Software Engineer",
      company: JOB_1_COMP,
      status: "interviewing",
    });
    assertEquals(updatedJobId, aliceJob1Id);
  });

  await test.step("update: should throw an error when updating a non-existent job", async () => {
    const nonExistentJobId = "job:nonexistent" as ID;
    await assertRejects(
      () =>
        jobTracker.update({
          user: USER_ALICE,
          job: nonExistentJobId,
          position: "Fake",
          company: "Fake",
          status: "Fake",
        }),
      Error,
      `Job with ID '${nonExistentJobId}' not found for user '${USER_ALICE}' or not owned by them.`,
    );
  });

  await test.step("update: should throw an error when a user tries to update another user's job", async () => {
    // Get Bob's job ID
    const { jobs: bobJobs } = await jobTracker.getJobs({ user: USER_BOB });
    const bobJobId = bobJobs[0]._id;

    await assertRejects(
      () =>
        jobTracker.update({
          user: USER_ALICE, // Alice tries to update Bob's job
          job: bobJobId,
          position: "Evil Genius",
          company: "Evil Corp",
          status: "hired",
        }),
      Error,
      `Job with ID '${bobJobId}' not found for user '${USER_ALICE}' or not owned by them.`,
    );

    // Ensure Bob's job details remain unchanged
    const { jobs: bobJobsAfterAttempt } = await jobTracker.getJobs({ user: USER_BOB });
    assertEquals(bobJobsAfterAttempt.length, 1);
    assertEquals(bobJobsAfterAttempt[0].position, JOB_1_POS); // Original position
  });

  await test.step("getJobs: should retrieve all jobs for a specific user", async () => {
    // Add another job for Alice to ensure multiple jobs are returned
    await jobTracker.add({
      user: USER_ALICE,
      position: JOB_3_POS,
      company: JOB_3_COMP,
      status: JOB_3_STATUS,
    });

    const { jobs: aliceJobs } = await jobTracker.getJobs({ user: USER_ALICE });
    assertEquals(aliceJobs.length, 2); // The updated job and the newly added one
    const positions = aliceJobs.map((j) => j.position);
    assertEquals(positions.includes("Senior Software Engineer"), true);
    assertEquals(positions.includes(JOB_3_POS), true);
    assertEquals(positions.includes(JOB_1_POS), false); // Original JOB_1_POS was updated
  });

  await test.step("getJobs: should return an empty array for a user with no jobs", async () => {
    const userCharlie: ID = "user:Charlie" as ID;
    const { jobs } = await jobTracker.getJobs({ user: userCharlie });
    assertEquals(jobs.length, 0);
  });

  await test.step("getJobs: should correctly separate jobs by user", async () => {
    // We have Alice's jobs (2) and Bob's jobs (1)
    const { jobs: aliceJobs } = await jobTracker.getJobs({ user: USER_ALICE });
    assertEquals(aliceJobs.length, 2);
    assertEquals(aliceJobs.every((j) => j.userId === USER_ALICE), true);

    const { jobs: bobJobs } = await jobTracker.getJobs({ user: USER_BOB });
    assertEquals(bobJobs.length, 1);
    assertEquals(bobJobs.every((j) => j.userId === USER_BOB), true);
  });

  // --- Trace the principle ---
  await test.step("Principle Trace: User adds, tracks, and then updates or removes a job", async () => {
    const traceUser: ID = "user:Trace" as ID;
    const tracePosition = "Junior Developer";
    const traceCompany = "Startup Co";
    const traceStatusInitial = "pending";
    const traceStatusUpdated = "accepted";

    // 1. Add a job
    const { job: traceJobId } = await jobTracker.add({
      user: traceUser,
      position: tracePosition,
      company: traceCompany,
      status: traceStatusInitial,
    });

    let { jobs: userJobs } = await jobTracker.getJobs({ user: traceUser });
    assertEquals(userJobs.length, 1, "Should have 1 job after adding");
    assertEquals(userJobs[0].status, traceStatusInitial, "Initial status should be 'pending'");

    // 2. Update the status
    await jobTracker.update({
      user: traceUser,
      job: traceJobId,
      position: tracePosition,
      company: traceCompany,
      status: traceStatusUpdated,
    });

    ({ jobs: userJobs } = await jobTracker.getJobs({ user: traceUser }));
    assertEquals(userJobs.length, 1, "Should still have 1 job after updating");
    assertEquals(userJobs[0].status, traceStatusUpdated, "Status should be updated to 'accepted'");

    // 3. Remove the job
    await jobTracker.remove({ user: traceUser, job: traceJobId });

    ({ jobs: userJobs } = await jobTracker.getJobs({ user: traceUser }));
    assertEquals(userJobs.length, 0, "Should have 0 jobs after removing");
  });

  await client.close();
});
```
