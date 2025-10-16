---
timestamp: 'Thu Oct 16 2025 18:14:15 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_181415.93d25a33.md]]'
content_id: d416362a7ef9477e66323b3242d0600f337c3152ee0cc3ca24a7b47dc506db44
---

# concept: JobTracker

* **purpose:** keeps track of the jobs that the user has applied to, as well as the status (pending, rejected, accepted)
* **principle:** when a user adds to the job tracker a job that they applied to, they can track it via updating the status from pending to accepted or rejected, or they can remove the job from the list
* ## state:
  * a set of Jobs
    * a User
    * a position of type String
    * a company of type String
    * a status of type String
* actions:
  * add(user: User, position: string, company: string, status: string): (Job)
    * requires: the pairing position, company is unique under user
    * effects: creates a new Job with position at company, with status, and adds it under user
  * remove(user: User, job: Job): (Job)
    * requires: job exists, user exists, and job exists under user.
    * effects: removes job from set
  * update(user: User, job: Job, position: string, company: string, status: string): (Job)
    * requires: job exists, user exists, and job exists under user.
    * effects: updates information of job to be position, company, and status

***
