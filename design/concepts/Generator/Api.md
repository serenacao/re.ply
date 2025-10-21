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

Now, analyze the following Concept Specification and generate the API documentation based on these instructions.

[@generator-concept](./Implementation.md)
# response:

# API Specification: Generator Concept

**Purpose:** support the generation and iterative refinement of professional application-related text using an AI model

---

## API Endpoints

### POST /api/Generator/generate

**Description:** Generates an initial draft of professional application-related text based on a user question and provided context files.

**Requirements:**
- The input `question` must be a valid professional application-related question.

**Effects:**
- If the `question` is valid:
    - The concept's internal `question` state is set to the input `question`.
    - The concept's internal `draft` state is set to the generated text from the LLM.
    - The generated `draft` is returned.
- If the `question` is not valid:
    - An `error` message "The input is not a valid question." is returned.
    - The concept's state remains unchanged.

**Request Body:**
```json
{
  "question": "string",
  "files": [
    {
      "name": "string",
      "content": "string"
    }
  ]
}
```

**Success Response Body (Action):**
```json
{
  "draft": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Generator/edit

**Description:** Allows a user to directly edit the current draft, and the system attempts to infer feedback from the changes.

**Requirements:**
- true (always allowed)

**Effects:**
- The concept's `draft` state is updated to `newDraft`.
- If the `newDraft` differs from the old `draft`, inferred feedback about the changes is added to the `feedbackHistory`.

**Request Body:**
```json
{
  "newDraft": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Generator/accept

**Description:** Marks the current draft as accepted, indicating finalization.

**Requirements:**
- true (always allowed)

**Effects:**
- The concept's `accepted` state is set to `true`.

**Request Body:**
```json
{}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Generator/feedback

**Description:** Applies user-provided feedback to the current draft and regenerates it.

**Requirements:**
- The input `comment` must be valid actionable feedback.
- A `draft` must already exist in the concept's state.

**Effects:**
- If the `comment` is valid and a `draft` exists:
    - The `comment` is added to the concept's `feedbackHistory`.
    - The concept's `draft` state is updated with the revised text from the LLM.
    - The new `draft` is returned.
- If the `comment` is not valid:
    - An `error` message "Please submit valid actionable feedback." is returned.
    - The concept's state remains unchanged.
- If no `draft` exists:
    - An `error` message (implicitly, though not explicitly coded in TS) indicating that a draft is required for feedback would be returned. (Based on typical concept design implications where actions on non-existent state are disallowed.)

**Request Body:**
```json
{
  "comment": "string"
}
```

**Success Response Body (Action):**
```json
{
  "draft": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---