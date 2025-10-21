---
timestamp: 'Mon Oct 20 2025 20:59:30 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_205930.3f5bb761.md]]'
content_id: db3647a0c2c30e35c47e334768090a5005123007a18091c6531297650b1d0ade
---

# API Specification: Folder Concept

**Purpose:** Organize items hierarchically.

***

## API Endpoints

### POST /api/Folder/createFolder

**Description:** Creates a new folder, optionally specifying a parent folder.

**Requirements:**

* (Inferred) The `name` is unique within the specified `parentFolder` (or top-level if no parent).

**Effects:**

* (Inferred) A new folder entity is created.

**Request Body:**

```json
{
  "parentFolder": "Folder ID | null",
  "name": "String"
}
```

**Success Response Body (Action):**

```json
{
  "folder": "Folder ID"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Folder/delete

**Description:** Deletes a specified folder and its contents.

**Requirements:**

* (Inferred) The `folder` exists.
* (Inferred) User has permissions to delete the folder.

**Effects:**

* (Inferred) The folder and all its contained items/subfolders are removed.

**Request Body:**

```json
{
  "folder": "Folder ID"
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

### POST /api/Folder/rename

**Description:** Renames an existing folder.

**Requirements:**

* (Inferred) The `folder` exists.
* (Inferred) The `newName` is unique within the folder's parent.

**Effects:**

* (Inferred) The name of the specified `folder` is updated to `newName`.

**Request Body:**

```json
{
  "folder": "Folder ID",
  "newName": "String"
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

### POST /api/Folder/move

**Description:** Moves a folder to a new parent folder.

**Requirements:**

* (Inferred) The `folder` exists.
* (Inferred) The `newParentFolder` exists or is null for root level.
* (Inferred) The move operation does not create a circular dependency.

**Effects:**

* (Inferred) The specified `folder` is moved to be a child of `newParentFolder`.

**Request Body:**

```json
{
  "folder": "Folder ID",
  "newParentFolder": "Folder ID | null"
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
