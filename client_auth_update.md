# Client (Frontend) Auth & Multi-Tenancy Update Guide

## Overview

The backend has been migrated to a **multi-tenant architecture**. Every API request now requires:
1. A valid **JWT token** (`Authorization: Bearer <token>`)
2. An **organization context** — either explicitly via `x-org-id` header, or implicitly via default fallback

All entity queries are now scoped to the current organization. No data from one school leaks to another.

---

## 1. Authentication Flow (unchanged)

### Login

```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Login via Telegram

```
POST /auth/login/tg
Content-Type: application/json

{
  "tgId": "123456789"
}
```

---

## 2. JWT Token Payload

The decoded token now contains:

```json
{
  "sub": "69f8d7b536e953f651053790",   // User.mongoId (string)
  "role": "admin",                      // "admin" | "teacher" | "student"
  "iat": 1779108863,
  "exp": 1779713663
}
```

**Important:** The backend extracts `userId` from `sub`. Do NOT add `id` (integer) to the token — it uses `mongoId` (string).

---

## 3. Required Headers for All API Requests

Every authenticated request *must* include:

```
Authorization: Bearer <token>
```

**Optionally** (for multi-org support in the future):

```
x-org-id: <organization-uuid>
```

If `x-org-id` is omitted, the server **defaults** to organization with slug `chsm_brass_eu`.

> **For now:** If the client only works with one school, you can omit `x-org-id`.  
> **For future:** When multiple schools are supported, the client must send the correct `x-org-id`.

---

## 4. Critical: GET Requests Must NOT Have a Body

This is the most common mistake. **GET requests must never include `body` or `Content-Type: application/json`.**

### ❌ WRONG:

```javascript
const myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer <token>");
myHeaders.append("Content-Type", "application/json");  // ← DON'T

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  body: "\n    ",  // ← DON'T! Causes 400 "JSON Parse error: Unexpected EOF"
  redirect: "follow"
};

fetch("http://localhost:5008/students", requestOptions)
```

### ✅ CORRECT:

```javascript
const myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer <token>");

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow"
  // No body, no Content-Type
};

fetch("http://localhost:5008/students", requestOptions)
```

### ✅ ALSO CORRECT (explicit org ID):

```javascript
const myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer <token>");
myHeaders.append("x-org-id", "9550e896-0f07-411f-aca4-c23d5a418720");

fetch("http://localhost:5008/students", { method: "GET", headers: myHeaders })
```

---

## 5. POST/PATCH Requests (with body)

These work as before:

```javascript
const raw = JSON.stringify({
  "studentId": "a2d08882-...",
  "practiceType": "LITURGICAL"
});

const requestOptions = {
  method: "POST",
  headers: {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  body: raw,
  redirect: "follow"
};

fetch("http://localhost:5008/practices", requestOptions)
```

---

## 6. Backend Guard Behavior (for debugging)

The `MultiTenancyGuard` now performs these checks on every request:

1. **JWT validation** — token must be valid and not expired
2. **Role check** — user must have allowed role (admin, teacher, or student)
3. **Organization resolution** — reads `x-org-id` header, falls back to `chsm_brass_eu`
4. **User lookup** — finds `User` record by `mongoId` from JWT's `sub` claim
5. **Membership check** — verifies `OrgMember` record exists for the user in the resolved organization

If any check fails, the server returns one of:
- `401 Unauthorized` — invalid/expired token, or user not found in DB
- `403 Forbidden` — user not a member of the organization
- `404 Not Found` — default organization (`chsm_brass_eu`) doesn't exist

---

## 7. Testing Checklist

After implementing the client changes, verify:

- [ ] Login with email/password returns a valid token
- [ ] GET `/students` (list) returns data without errors
- [ ] GET `/students/v2/:id` (single student) returns data
- [ ] GET `/students/:id` without token returns `401`
- [ ] POST/PATCH requests with body work correctly
- [ ] All GET requests have NO body and NO `Content-Type`

---

## 8. Error Responses Reference

| Status | Body | Cause |
|--------|------|-------|
| `400` | `"JSON Parse error: Unexpected EOF"` | GET request has `body` or `Content-Type: application/json` |
| `401` | `"Unauthorized"` | Missing/invalid/expired token |
| `401` | `"User not found in request"` | Token valid but backend guard can't extract user (see §4) |
| `401` | `"User not found in database"` | Token `sub` doesn't match any `User.mongoId` in DB |
| `403` | `"You are not a member of this organization"` | User exists but not in `OrgMember` table for this org |
| `404` | `"Default organization not found"` | Organization `chsm_brass_eu` doesn't exist in DB |

---

## 9. Quick Test Snippet (Node.js / Bun)

```javascript
const TOKEN = "eyJhbGciOiJIUzI1NiIs...";

async function test() {
  // Test GET /students
  const students = await fetch("http://localhost:5008/students", {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  console.log("Students:", await students.json());

  // Test GET /students/v2/:id
  const student = await fetch(
    "http://localhost:5008/students/v2/a2d08882-df9f-4980-867e-e0d7e3da2c00",
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  console.log("Student:", await student.json());
}

---

## 10. Registration Flow — New User + OrgMember

When a new user registers (via `POST /api/users` or Telegram sync), the backend **automatically** creates an `OrgMember` record.

### Registration endpoint

```
POST /api/users
Content-Type: application/json

{
  "email": "newuser@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "organizationId": "9550e896-0f07-411f-aca4-c23d5a418720"  // optional, falls back to chsm_brass_eu
}
```

### What happens server-side

1. User is created in `users` table with a generated `mongoId`
2. If `organizationId` provided — OrgMember is created for that org
3. If `organizationId` omitted — OrgMember is created for `chsm_brass_eu` (fallback)
4. Role in OrgMember = `STUDENT` by default

### Telegram sync

`PATCH /internal/users/sync` also supports `organizationId` in the body:

```json
{
  "tgId": "123456789",
  "firstName": "John",
  "organizationId": "9550e896-..."
}
```

If the user already exists (update), `organizationId` is ignored. If the user is new, OrgMember is created.

### No manual OrgMember creation needed

The client does NOT need to call a separate endpoint to add user to organization — it happens automatically during user creation.
```
