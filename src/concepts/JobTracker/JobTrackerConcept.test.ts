import { assertEquals, assertRejects } from "jsr:@std/assert";
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { testDb } from "@utils/database.ts"; // Assuming testDb is correctly exported from here
import JobTrackerConcept, { Job } from "./JobTrackerConcept.ts";

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

const NON_EXISTENT_JOB = {
      user: '',
      position: '',
      company: '',
      status: '',
    } as Job;

Deno.test("JobTracker Concept Tests", async (test) => {
  const [db, client] = await testDb();
  const jobTracker = new JobTrackerConcept(db);

  try {
    await test.step("should initialize with an empty state", async () => {
      const { jobs } = await jobTracker.getJobs({ user: USER_ALICE });
      assertEquals(jobs.length, 0);
    });

    await test.step("add: should successfully add a new job", async () => {
      await jobTracker.add({
        user: USER_ALICE,
        position: JOB_1_POS,
        company: JOB_1_COMP,
        status: JOB_1_STATUS,
      });

      const { jobs } = await jobTracker.getJobs({ user: USER_ALICE });
      console.log('jobs under alice',jobs);
      assertEquals(jobs.length, 1);
      assertEquals(jobs[0].user, USER_ALICE);
      assertEquals(jobs[0].position, JOB_1_POS);
      assertEquals(jobs[0].company, JOB_1_COMP);
      assertEquals(jobs[0].status, JOB_1_STATUS);
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
      await jobTracker.add({
        user: USER_BOB,
        position: JOB_1_POS,
        company: JOB_1_COMP,
        status: JOB_1_STATUS,
      });

      const { jobs: aliceJobs } = await jobTracker.getJobs({ user: USER_ALICE });
      assertEquals(aliceJobs.length, 1); // Alice still has only her job

      const { jobs: bobJobs } = await jobTracker.getJobs({ user: USER_BOB });
      assertEquals(bobJobs.length, 1); // Bob has his job
      assertEquals(bobJobs[0].user, USER_BOB);
      assertEquals(bobJobs[0].position, JOB_1_POS);
      assertEquals(bobJobs[0].company, JOB_1_COMP);
      assertEquals(bobJobs[0].status, JOB_1_STATUS);
    });

    let aliceJob2Info: {position: string, company: string};
    let aliceJob2: Job;
    await test.step("add: should allow adding multiple distinct jobs for the same user", async () => {
      aliceJob2 = {
        user: USER_ALICE,
        position: JOB_2_POS,
        company: JOB_2_COMP,
        status: JOB_2_STATUS,
      };
      await jobTracker.add(aliceJob2);

      aliceJob2Info = { position: JOB_2_POS, company: JOB_2_COMP }

      const { jobs } = await jobTracker.getJobs({ user: USER_ALICE });
      assertEquals(jobs.length, 2); // Alice now has two jobs
      const jobPositions = jobs.map((j) => j.position);
      assertEquals(jobPositions.includes(JOB_1_POS), true);
      assertEquals(jobPositions.includes(JOB_2_POS), true);
    });

    await test.step("remove: should successfully remove an existing job by the owner", async () => {
      // First, ensure Alice has the job we're about to remove
      const { jobs: aliceJobsBeforeRemove } = await jobTracker.getJobs({ user: USER_ALICE });
      const jobToRemove = aliceJobsBeforeRemove.find(job => job.company == aliceJob2Info.company && job.position == aliceJob2Info.position);
      assertEquals(!!jobToRemove, true, "Job to remove should exist before removal");

      // Perform removal
      const { job: removedJob } = await jobTracker.remove({
        user: USER_ALICE,
        job: aliceJob2,
      });
      assertEquals(removedJob, aliceJob2);

      // Verify it's gone
      const { jobs: aliceJobsAfterRemove } = await jobTracker.getJobs({ user: USER_ALICE });
      assertEquals(aliceJobsAfterRemove.length, 1); // Alice now has only one job left
      assertEquals(
        aliceJobsAfterRemove.some(job => job.company == aliceJob2Info.company && job.position == aliceJob2Info.position),
        false,
      );
    });

    await test.step("remove: should throw an error when removing a non-existent job", async () => {
      await assertRejects(
        () => jobTracker.remove({ user: USER_ALICE, job: NON_EXISTENT_JOB }),
        Error,
        `Job not found for user '${USER_ALICE}' or not owned by them.`,
      );
    });

    await test.step("remove: should throw an error when a user tries to remove another user's job", async () => {
      // Get Bob's job ID
      const { jobs: bobJobs } = await jobTracker.getJobs({ user: USER_BOB });
      const bobJob = bobJobs[0];
      console.log('bobjob', bobJob)
      await assertRejects(
        () => jobTracker.remove({ user: USER_ALICE, job: bobJob }), // Alice tries to remove Bob's job
        Error,
        `Job not found for user '${USER_ALICE}' or not owned by them.`,
      );

      // Ensure Bob's job still exists
      const { jobs: bobJobsAfterAttempt } = await jobTracker.getJobs({ user: USER_BOB });
      assertEquals(bobJobsAfterAttempt.length, 1);
    });

    let aliceJob: Job;
    await test.step("update: should successfully update an existing job", async () => {
      // Get Alice's remaining job ID (the first one added)
      const { jobs: aliceJobs } = await jobTracker.getJobs({ user: USER_ALICE });
      assertEquals(aliceJobs.length, 1);
      aliceJob = aliceJobs[0];

      const newPosition = "Senior Software Engineer";
      const newStatus = "interviewing";

      const {job: newJob} = await jobTracker.update({
        user: USER_ALICE,
        job: aliceJob,
        position: newPosition,
        company: JOB_1_COMP, // Company remains the same
        status: newStatus,
      });
      aliceJob = newJob;

      const { jobs: updatedAliceJobs } = await jobTracker.getJobs({ user: USER_ALICE });
      assertEquals(updatedAliceJobs.length, 1);
      assertEquals(updatedAliceJobs[0].position, newPosition);
      assertEquals(updatedAliceJobs[0].company, JOB_1_COMP);
      assertEquals(updatedAliceJobs[0].status, newStatus);
    });

    await test.step("update: should return successfully even if no data actually changes", async () => {
      // Update with the same data again
      const { job: updatedJob } = await jobTracker.update({
        user: USER_ALICE,
        job: aliceJob,
        position: aliceJob.position,
        company: aliceJob.company,
        status: aliceJob.status,
      });
      assertEquals(updatedJob.position, aliceJob.position);
      assertEquals(updatedJob.company, aliceJob.company);
    });

    await test.step("update: should throw an error when updating a non-existent job", async () => {
      
      await assertRejects(
        () =>
          jobTracker.update({
            user: USER_ALICE,
            job: NON_EXISTENT_JOB,
            position: "Fake",
            company: "Fake",
            status: "Fake",
          }),
        Error,
        `Job not found for user '${USER_ALICE}' or not owned by them.`,
      );
    });

    await test.step("update: should throw an error when a user tries to update another user's job", async () => {
      // Get Bob's job ID
      const { jobs: bobJobs } = await jobTracker.getJobs({ user: USER_BOB });
      const bobJob = bobJobs[0];

      await assertRejects(
        () =>
          jobTracker.update({
            user: USER_ALICE, // Alice tries to update Bob's job
            job: bobJob,
            position: "Evil Genius",
            company: "Evil Corp",
            status: "hired",
          }),
        Error,
        `Job not found for user '${USER_ALICE}' or not owned by them.`,
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
      assertEquals(aliceJobs.every((j) => j.user === USER_ALICE), true);

      const { jobs: bobJobs } = await jobTracker.getJobs({ user: USER_BOB });
      assertEquals(bobJobs.length, 1);
      assertEquals(bobJobs.every((j) => j.user === USER_BOB), true);
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
    await test.step('closing connection', async () => {
    console.log("Closing MongoDB client...");
    await client.close();
    console.log("Closed successfully ✅");
  })
  } finally {
    console.log("Closing MongoDB client...");
    await client.close();
    console.log("Closed successfully ✅");
  }
  
});