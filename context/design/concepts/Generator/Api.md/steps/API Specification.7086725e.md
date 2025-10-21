---
timestamp: 'Mon Oct 20 2025 20:59:30 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_205930.3f5bb761.md]]'
content_id: 7086725e690ea3f7ec25a80866140a16a4992c2b6518cb7f760c9c6ee499f3b8
---

# API Specification: Trash Concept

**Purpose:** support deletion of items with possibility of restoring

***

## API Endpoints

### POST /api/Trash/delete

**Description:** Moves an item to the trash, allowing for potential restoration.

**Requirements:**

* (Inferred) The item exists and is not already in trash.

**Effects:**

* (Inferred) The item is marked as deleted and placed in the trash.

**Request Body:**

```json
{
  "item": "Item ID"
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

### POST /api/Trash/restore

**Description:** Restores a previously deleted item from the trash.

**Requirements:**

* (Inferred) The item exists in the trash.

**Effects:**

* (Inferred) The item is moved out of the trash and restored to its original state/location.

**Request Body:**

```json
{
  "item": "Item ID"
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

### POST /api/Trash/empty

**Description:** Permanently deletes all items currently in the trash.

**Requirements:**

* (Inferred) User has permission to empty trash.

**Effects:**

* (Inferred) All items in the trash are permanently removed from the system.

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
