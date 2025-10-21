---
timestamp: 'Mon Oct 20 2025 21:58:15 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_215815.aee3a744.md]]'
content_id: e82382364b13d31331c159302b8b7c9a6b4b6f5ef340287d42b82623351d80d9
---

# API Specification: UserAuthentication Concept

**Purpose:** limit access to known users

***

## API Endpoints

### POST /api/UserAuthentication/register

**Description:** Registers a new user account with a unique username and password.

**Requirements:**

* username does not exist already

**Effects:**

* creates a new User with username and password

**Request Body:**

```json
{
  "username": "String",
  "password": "String"
}
```

**Success Response Body (Action):**

```json
{
  "User": "User"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuthentication/authenticate

**Description:** Authenticates an existing user by verifying their username and password.

**Requirements:**

* user with username and password to exist

**Effects:**

* returns user

**Request Body:**

```json
{
  "username": "String",
  "password": "String"
}
```

**Success Response Body (Action):**

```json
{
  "User": "User"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
