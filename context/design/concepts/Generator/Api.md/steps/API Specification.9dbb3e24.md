---
timestamp: 'Mon Oct 20 2025 20:59:30 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_205930.3f5bb761.md]]'
content_id: 9dbb3e24faf65e04c7ab1cb964657d5a5630f1ff55f713156f9bd70a46bdba56
---

# API Specification: RestaurantReservation Concept

**Purpose:** Manage reservations for a restaurant.

***

## API Endpoints

### POST /api/RestaurantReservation/reserve

**Description:** Makes a new reservation for a party at a specified time.

**Requirements:**

* (Inferred) A table of the requested size is available at the specified time.
* (Inferred) The `partySize` is a positive number.

**Effects:**

* (Inferred) A new reservation is created and recorded.

**Request Body:**

```json
{
  "partySize": "Number",
  "time": "DateTime"
}
```

**Success Response Body (Action):**

```json
{
  "reservationId": "String"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/RestaurantReservation/cancel

**Description:** Cancels an existing reservation.

**Requirements:**

* (Inferred) The `reservationId` corresponds to an existing and active reservation.

**Effects:**

* (Inferred) The specified reservation is marked as canceled.

**Request Body:**

```json
{
  "reservationId": "String"
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

### POST /api/RestaurantReservation/seat

**Description:** Marks a reservation as seated.

**Requirements:**

* (Inferred) The `reservationId` corresponds to an existing and active reservation.
* (Inferred) The party has arrived and been seated.

**Effects:**

* (Inferred) The specified reservation is marked as seated.

**Request Body:**

```json
{
  "reservationId": "String"
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

### POST /api/RestaurantReservation/noShow

**Description:** Marks a reservation as a no-show.

**Requirements:**

* (Inferred) The `reservationId` corresponds to an existing and active reservation.
* (Inferred) The party did not arrive for their reservation.

**Effects:**

* (Inferred) The specified reservation is marked as a no-show.

**Request Body:**

```json
{
  "reservationId": "String"
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
