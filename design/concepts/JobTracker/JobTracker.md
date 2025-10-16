# concept JobTracker

- **purpose:** keeps track of the jobs that the user has applied to, as well as the status (pending, rejected, accepted)

- **principle:** when a user adds to the job tracker a job that they applied to, they can  track it via updating the status from pending to accepted or rejected, or they can remove the job from the list

- state:
	- 
	- a set of Jobs
		- a User
		- a position of type String
		- a company of type String
		- a status of type String

- actions:
	- add(user: User, position: string, company: string, status: string): (Job)
		- requires: the pairing position, company is unique under user
		- effects: creates a new Job with position at company, with status, and adds it under user 
	- remove(user: User, job: Job):  (Job)
		- requires: job exists, user exists, and job exists under user.
		- effects: removes job from set
	- update(user: User, job: Job, position: string, company: string, status: string):  (Job)
		- requires: job exists, user exists, and job exists under user.
		- effects: updates information of job to be position, company, and status
	- getJobs(user: User): (Job[])
		- requires: user exists
		- effects: returns all jobs being tracked by user

