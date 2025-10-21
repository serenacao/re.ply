---
timestamp: 'Mon Oct 20 2025 22:35:20 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_223520.961013d8.md]]'
content_id: 629346bec1813d49cf1d9f5ddd5b87f303041318cdd70a1cdf542d32392dc70c
---

# API Specification: JobTracker Concept

**Purpose:** keeps track of the jobs that the user has applied to, as well as the status (pending, rejected, accepted)

***

## API Endpoints

### POST /api/JobTracker/add

**Description:** Creates a new job entry for a user with the specified position, company, and initial status.

**Requirements:**

* The pairing (position, company) is unique for the given user.

**Effects:**

* Creates a new Job with the specified position at the given company, with the provided status, and adds it under the user.

**Request Body:**

```json
{
  "user": "string",
  "position": "string",
  "company": "string",
  "status": "string"
}
```

**Success Response Body (Action):**

```json
{
  "job": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/JobTracker/remove

**Description:** Removes an existing job entry from a user's tracked list.

**Requirements:**

* The specified job exists.
* The specified user exists.
* The specified job is associated with the user.

**Effects:**

* Removes the job from the set of tracked jobs.

**Request Body:**

```json
{
  "user": "string",
  "job": "string"
}
```

**Success Response Body (Action):**

```json
{
  "job": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/JobTracker/update

**Description:** Updates the position, company, and status information for an existing job entry of a user.

**Requirements:**

* The specified job exists.
* The specified user exists.
* The specified job is associated with the user.

**Effects:**

* Updates the job's information to the new position, company, and status.

**Request Body:**

```json
{
  "user": "string",
  "job": "string",
  "position": "string",
  "company": "string",
  "status": "string"
}
```

**Success Response Body (Action):**

```json
{
  "job": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/JobTracker/getJobs

**Description:** Retrieves all job entries currently being tracked by a specific user.

**Requirements:**

* The specified user exists.

**Effects:**

* Returns a list of all jobs associated with the user.

**Request Body:**

```json
{
  "user": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "user": "string",
    "position": "string",
    "company": "string",
    "status": "string"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
