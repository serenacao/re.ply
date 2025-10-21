---
timestamp: 'Mon Oct 20 2025 16:47:37 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_164737.9e255b7f.md]]'
content_id: 6ca49ec30b4c23cfac96555b5961e6e86875f35120449b9fe5c2b0e4daebffc9
---

# API Specification: Labeling Concept

**Purpose:** The functionality of associating labels with items and then retrieving the items that match a given label.

***

## API Endpoints

### POST /api/Labeling/createLabel

**Description:** Creates a new label with the specified name.

**Requirements:**

* No Label with the given `name` already exists.

**Effects:**

* Creates a new Label `l`.
* Sets the name of `l` to `name`.
* Returns `l` as `label`.

**Request Body:**

```json
{
  "name": "string"
}
```

**Success Response Body (Action):**

```json
{
  "label": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Labeling/addLabel

**Description:** Associates a specific label with a given item.

**Requirements:**

* true

**Effects:**

* The `item` is now associated with the `label`.

**Request Body:**

```json
{
  "item": "string",
  "label": "string"
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

### POST /api/Labeling/deleteLabel

**Description:** Dissociates a specific label from a given item.

**Requirements:**

* true

**Effects:**

* The `item` is no longer associated with the `label`.

**Request Body:**

```json
{
  "item": "string",
  "label": "string"
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
