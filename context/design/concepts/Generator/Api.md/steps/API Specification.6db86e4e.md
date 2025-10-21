---
timestamp: 'Mon Oct 20 2025 20:59:30 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_205930.3f5bb761.md]]'
content_id: 6db86e4efe6a3db3d454f8dc1383361a573c3ccae33fdd25176ca8b7eb62c80f
---

# API Specification: Labeling Concept

**Purpose:** Associate labels with generic items for organization and retrieval.

***

## API Endpoints

### POST /api/Labeling/createLabel

**Description:** Creates a new label with a specified name.

**Requirements:**

* (Inferred) The `name` for the label is unique.

**Effects:**

* (Inferred) A new label entity is created with the given name.

**Request Body:**

```json
{
  "name": "String"
}
```

**Success Response Body (Action):**

```json
{
  "label": "Label ID"
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

**Description:** Associates an existing label with a specific item.

**Requirements:**

* (Inferred) Both the `item` and `label` exist.
* (Inferred) The `item` is not already associated with the `label`.

**Effects:**

* (Inferred) The specified `label` is added to the set of labels for the `item`.

**Request Body:**

```json
{
  "item": "Item ID",
  "label": "Label ID"
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

**Description:** Removes a specific label from an item.

**Requirements:**

* (Inferred) Both the `item` and `label` exist.
* (Inferred) The `item` is currently associated with the `label`.

**Effects:**

* (Inferred) The specified `label` is removed from the set of labels for the `item`.

**Request Body:**

```json
{
  "item": "Item ID",
  "label": "Label ID"
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
