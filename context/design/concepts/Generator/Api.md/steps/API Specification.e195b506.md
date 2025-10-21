---
timestamp: 'Mon Oct 20 2025 21:19:05 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_211905.6639acca.md]]'
content_id: e195b506abcb701d6a395843ed430c958f59bc5be8c300f615792fc3bb6f3d1d
---

# API Specification: Generator Concept

**Purpose:** support the generation and iterative refinement of professional application-related text using an AI model

***

## API Endpoints

### POST /api/Generator/generate

**Description:** Generates an initial draft of professional application-related text based on a user question and provided context files.

**Requirements:**

* The input `question` must be a valid professional application-related question.

**Effects:**

* If the `question` is valid:
  * The concept's internal `question` state is set to the input `question`.
  * The concept's internal `draft` state is set to the generated text from the LLM.
  * The generated `draft` is returned.
* If the `question` is not valid:
  * An `error` message "The input is not a valid question." is returned.
  * The concept's state remains unchanged.

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

***

### POST /api/Generator/edit

**Description:** Allows a user to directly edit the current draft, and the system attempts to infer feedback from the changes.

**Requirements:**

* true (always allowed)

**Effects:**

* The concept's `draft` state is updated to `newDraft`.
* If the `newDraft` differs from the old `draft`, inferred feedback about the changes is added to the `feedbackHistory`.

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

***

### POST /api/Generator/accept

**Description:** Marks the current draft as accepted, indicating finalization.

**Requirements:**

* true (always allowed)

**Effects:**

* The concept's `accepted` state is set to `true`.

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

***

### POST /api/Generator/feedback

**Description:** Applies user-provided feedback to the current draft and regenerates it.

**Requirements:**

* The input `comment` must be valid actionable feedback.
* A `draft` must already exist in the concept's state.

**Effects:**

* If the `comment` is valid and a `draft` exists:
  * The `comment` is added to the concept's `feedbackHistory`.
  * The concept's `draft` state is updated with the revised text from the LLM.
  * The new `draft` is returned.
* If the `comment` is not valid:
  * An `error` message "Please submit valid actionable feedback." is returned.
  * The concept's state remains unchanged.
* If no `draft` exists:
  * An `error` message (implicitly, though not explicitly coded in TS) indicating that a draft is required for feedback would be returned. (Based on typical concept design implications where actions on non-existent state are disallowed.)

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

***
