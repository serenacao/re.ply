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
[@file-storage-concept](/design/concepts/FileStorage/FileStorage.md)

Now, analyze the following Concept Specification and generate the API documentation based on these instructions.


# response:

# API Specification: UserContextFiles Concept

**Purpose:** stores files that the user would like the generator to have as context while generating an answer to their question, such as writing style, skills, etc

---

## API Endpoints

### POST /api/UserContextFiles/upload

**Description:** Uploads a new file with a specified name and content for a given user.

**Requirements:**
- user exists
- name does not already exist in user's Files

**Effects:**
- add new File to user's Files with name and content

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

---

### POST /api/UserContextFiles/remove

**Description:** Removes a file with the specified name from a user's collection of files.

**Requirements:**
- user exists
- name does exist in user's Files

**Effects:**
- remove file with name from user's Files

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

---

### POST /api/UserContextFiles/rename

**Description:** Renames an existing file for a given user.

**Requirements:**
- user exists
- name does exist in user's Files
- newName does not exist in user's Files

**Effects:**
- replaces name with newName in user's Files

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

---

### POST /api/UserContextFiles/files

**Description:** Retrieves all files stored under a specific user.

**Requirements:**
- user exists

**Effects:**
- return all Files under User

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