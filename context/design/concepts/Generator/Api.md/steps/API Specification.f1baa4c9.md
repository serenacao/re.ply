---
timestamp: 'Mon Oct 20 2025 20:59:30 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_205930.3f5bb761.md]]'
content_id: f1baa4c9862aeb01f7c719c01abe94cad6c657f3c2128cdf77e6282322ca329a
---

# API Specification: Group Concept

**Purpose:** Manage collections of users.

***

## API Endpoints

### POST /api/Group/\_getUsersWithUsernamesAndPasswords

**Description:** Retrieves a list of users belonging to a specified group, including their usernames and passwords (for demonstration purposes, sensitive data like passwords should not be directly exposed in a real API).

**Requirements:**

* group exists

**Effects:**

* returns set of all users in the group each with its username and password

**Request Body:**

```json
{
  "group": "Group ID"
}
```

**Success Response Body (Query):**

```json
[
  {
    "username": "String",
    "password": "String"
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
