---
timestamp: 'Thu Oct 16 2025 18:14:45 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_181445.f965ab70.md]]'
content_id: 24f2fbee0bd6770dd7cc34d8717b9aedc833ce1411e7a050c722a1125ef0873a
---

# trace:

The principle for the `JobTracker` concept is: "when a user adds to the job tracker a job that they applied to, they can track it via updating the status from pending to accepted or rejected, or they can remove the job from the list".

Here's a step-by-step trace demonstrating how the actions `add`, `update`, and `remove` fulfill this principle:

**Scenario: Alice tracks her application to "Startup Co"**

**Initial State:**

* `JobTracker` collection is empty.
* `USER_ALICE` has no jobs being tracked.

**Step 1: User adds a job to the tracker.**

* **Action:** `jobTracker.add({ user: USER_ALICE, position: "Junior Developer", company: "Startup Co", status: "pending" })`
* **`requires` check:** No existing job for Alice with "Junior Developer" at "Startup Co". Condition met.
* **`effects`:**
  * A new `Job` entry (`traceJobId`) is created.
  * This entry is stored in the `jobs` collection with `userId: USER_ALICE`, `position: "Junior Developer"`, `company: "Startup Co"`, and `status: "pending"`.
* **Observed State:**
  * `jobTracker.getJobs({ user: USER_ALICE })` returns `[{ _id: traceJobId, userId: "user:Alice", position: "Junior Developer", company: "Startup Co", status: "pending" }]`.

**Step 2: User tracks the job by updating its status to "accepted".**

* **Action:** `jobTracker.update({ user: USER_ALICE, job: traceJobId, position: "Junior Developer", company: "Startup Co", status: "accepted" })`
* **`requires` check:** `traceJobId` exists and is owned by `USER_ALICE`. Condition met.
* **`effects`:**
  * The `status` field of the `Job` entry with `_id: traceJobId` is updated to `"accepted"`.
* **Observed State:**
  * `jobTracker.getJobs({ user: USER_ALICE })` returns `[{ _id: traceJobId, userId: "user:Alice", position: "Junior Developer", company: "Startup Co", status: "accepted" }]`.

**Step 3 (Alternative Path): User tracks the job by updating its status to "rejected".**

* (Assuming we reset to Step 1's outcome for this alternative, or continue from Step 2's "accepted" status).
* **Action:** `jobTracker.update({ user: USER_ALICE, job: traceJobId, position: "Junior Developer", company: "Startup Co", status: "rejected" })`
* **`requires` check:** `traceJobId` exists and is owned by `USER_ALICE`. Condition met.
* **`effects`:**
  * The `status` field of the `Job` entry with `_id: traceJobId` is updated to `"rejected"`.
* **Observed State:**
  * `jobTracker.getJobs({ user: USER_ALICE })` returns `[{ _id: traceJobId, userId: "user:Alice", position: "Junior Developer", company: "Startup Co", status: "rejected" }]`.

**Step 4: User decides they no longer want to track the job and removes it.**

* **Action:** `jobTracker.remove({ user: USER_ALICE, job: traceJobId })`
* **`requires` check:** `traceJobId` exists and is owned by `USER_ALICE`. Condition met.
* **`effects`:**
  * The `Job` entry with `_id: traceJobId` is deleted from the `jobs` collection.
* **Observed State:**
  * `jobTracker.getJobs({ user: USER_ALICE })` returns `[]` (an empty array).

This trace demonstrates that Alice can successfully *add* a job, *update* its status to reflect her tracking progress, and *remove* it when no longer needed, fully adhering to the concept's stated principle.
