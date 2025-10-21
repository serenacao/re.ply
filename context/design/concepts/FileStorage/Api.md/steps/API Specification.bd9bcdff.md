---
timestamp: 'Mon Oct 20 2025 17:17:22 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_171722.c74d2bf3.md]]'
content_id: bd9bcdff7db814d45d3fd879fc40f160bbf0d79d3d0b3b53f1573f6a5a8d2bf4
---

# API Specification: UserContextFiles Concept

**Purpose:** stores files that the user would like the generator to have as context while generating an answer to their question, such as writing style, skills, etc

***

## API Endpoints

### POST /api/UserContextFiles/upload

**Description:** Uploads a new file with a specified name and content for a given user.

**Requirements:**

* user exists
* name does not already exist in user's Files

**Effects:**

* add new File to user's Files with name and content

**Request Body:**

```json
{
  "user": "User",
  "name": "string",
  "content": "string"
}
```

**Success Response Body (Action):**

```json
{
  "File": "File"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserContextFiles/remove

**Description:** Removes a file with the specified name from a user's collection of files.

**Requirements:**

* user exists
* name does exist in user's Files

**Effects:**

* remove file with name from user's Files

**Request Body:**

```json
{
  "user": "User",
  "name": "string"
}
```

**Success Response Body (Action):**

```json
{
  "File": "File"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserContextFiles/rename

**Description:** Renames an existing file for a given user.

**Requirements:**

* user exists
* name does exist in user's Files
* newName does not exist in user's Files

**Effects:**

* replaces name with newName in user's Files

**Request Body:**

```json
{
  "user": "User",
  "name": "string",
  "newName": "string"
}
```

**Success Response Body (Action):**

```json
{
  "File": "File"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserContextFiles/files

**Description:** Retrieves all files stored under a specific user.

**Requirements:**

* user exists

**Effects:**

* return all Files under User

**Request Body:**

```json
{
  "user": "User"
}
```

**Success Response Body (Query):**

```json
[
  {
    "name": "string",
    "content": "string"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```
