[@concept-specifications](../../background/concept-specifications.md)

# Concept API extraction

You are an expert software architect tasked with generating clear, developer-friendly API documentation. Your input is a formal "Concept Specification" which describes a modular piece of software functionality. This concept has been implemented and exposed as a REST-like API by a "Concept Server."

Your mission is to translate the provided Concept Specification into a structured API specification document written in Markdown. This document will be used by frontend developers to interact with the API.

Adhere to the following rules for the API structure and the documentation format:

**API Structure Rules:**

1.  **Base URL:** Assume a base URL of `/api`.
2.  **Endpoint Naming:** Each concept action or query maps to an endpoint. The URL structure is: `/{conceptName}/{actionOrQueryName}`.
    *   For a concept named `Labeling` and an action `createLabel`, the endpoint is `/api/Labeling/createLabel`.
3.  **HTTP Method:** All endpoints use the `POST` method.
4.  **Data Format:** All requests and responses use the `application/json` content type.
5.  **Request Body:** The request body is always a single JSON object. The keys of this object correspond to the input arguments defined in the action's signature.
6.  **Response Body:**
    *   **Actions:** A successful call to an action returns a single JSON object. The keys correspond to the results defined in the action's signature. If there are no results, an empty object `{}` is returned.
    *   **Queries:** A successful call to a query (a method name starting with `_`) returns a JSON **array** of objects.
    *   **Errors:** If an action fails to meet its `requires` condition or encounters another error, it returns a single JSON object with a single key: `{ "error": "A descriptive error message." }`.

**Documentation Format Rules:**

Generate the output in Markdown using the following template. For each action and query in the specification, create a dedicated endpoint section.

~~~markdown
# API Specification: {Concept Name} Concept

**Purpose:** {The concept's purpose.}

---

## API Endpoints

### POST /api/{conceptName}/{actionName}

**Description:** {A brief, one-sentence description of what this action does.}

**Requirements:**
- {List each point from the 'requires' section of the specification.}

**Effects:**
- {List each point from the 'effects' section of the specification.}

**Request Body:**
```json
{
  "argument1": "{type}",
  "argument2": "{type}"
}
```

**Success Response Body (Action):**
```json
{
  "result1": "{type}",
  "result2": "{type}"
}
```

**Success Response Body (Query):**
```json
[
  {
    "result1": "{type}",
    "result2": "{type}"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
*(Repeat for each action and query)*
~~~

# prompt:
[@job-tracker-concept](/design/concepts/JobTracker/JobTracker.md)

Now, analyze the following Concept Specification and generate the API documentation based on these instructions.


# response:

# API Specification: JobTracker Concept

**Purpose:** keeps track of the jobs that the user has applied to, as well as the status (pending, rejected, accepted)

---

## API Endpoints

### POST /api/JobTracker/add

**Description:** Creates a new job entry for a user with the specified position, company, and initial status.

**Requirements:**
- The pairing (position, company) is unique for the given user.

**Effects:**
- Creates a new Job with the specified position at the given company, with the provided status, and adds it under the user.

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
---

### POST /api/JobTracker/remove

**Description:** Removes an existing job entry from a user's tracked list.

**Requirements:**
- The specified job exists.
- The specified user exists.
- The specified job is associated with the user.

**Effects:**
- Removes the job from the set of tracked jobs.

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
---

### POST /api/JobTracker/update

**Description:** Updates the position, company, and status information for an existing job entry of a user.

**Requirements:**
- The specified job exists.
- The specified user exists.
- The specified job is associated with the user.

**Effects:**
- Updates the job's information to the new position, company, and status.

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
---

### POST /api/JobTracker/getJobs

**Description:** Retrieves all job entries currently being tracked by a specific user.

**Requirements:**
- The specified user exists.

**Effects:**
- Returns a list of all jobs associated with the user.

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
---