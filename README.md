# Aqar — Rental Property Platform API

Production-grade **Authentication + Authorization (RBAC)** backend for a rental property platform.

Built with **NestJS**, **PostgreSQL**, **Prisma**, **JWT**, **Phone OTP**, and **Google OAuth**.

**دليل العميل (عربي — شرح الدورات بدون تفاصيل تقنية):** [`docs/CLIENT_GUIDE_AR.md`](docs/CLIENT_GUIDE_AR.md)

**لوحة مقدم الخدمة (Frontend / Dashboard):** [`docs/SERVICE_PROVIDER_README.md`](docs/SERVICE_PROVIDER_README.md)

---

## Table of Contents

- [Overview](#overview)
- [Service Provider Module (Dashboard Guide)](#service-provider-module-dashboard-guide)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Business Rules](#business-rules)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [RBAC & Permissions](#rbac--permissions)
- [Owner Profile & KYC](#owner-profile--kyc)
- [API Reference (Full)](#api-reference-full)
- [Swagger Documentation](#swagger-documentation)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deploy on Railway](#deploy-on-railway)
- [Deploy with Docker](#deploy-with-docker)
- [Admin & Seed](#admin--seed)
- [Auth Flows](#auth-flows)
- [Security](#security)
- [Scripts Reference](#scripts-reference)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

---

## Overview

This API provides:

- User registration & login (Email/Password)
- Phone OTP authentication (register or login without password)
- Google OAuth login
- Password reset via OTP (email or phone)
- JWT access + refresh tokens
- Permission-based access control (RBAC)
- **Owner KYC profile** — individual or company, admin approve/reject
- Example protected routes for Properties & Bookings

**User roles:**

| Role | Description |
|------|-------------|
| `ADMIN` | Full system access |
| `OWNER` | Manages own properties |
| `CUSTOMER` | Views published properties, creates bookings |
| `SERVICE_PROVIDER` | Manages services (food orders, transport leads) via Provider Portal |

---

## Service Provider Module (Dashboard Guide)

Full frontend documentation for building the **Provider Portal** in the dashboard project:

**[`docs/SERVICE_PROVIDER_README.md`](docs/SERVICE_PROVIDER_README.md)**

Includes:

- All API routes (`/provider/*`, `/services/*`, `/admin/providers/*`)
- Enums, permissions, post-login redirect logic
- Pages to build (`/provider/dashboard`, orders, leads, listings, coverage)
- FCM notification types
- React Query hooks structure
- Ready-to-copy Cursor prompt

### Website — عرض منيو المقدمين (للعميل)

**[`docs/WEBSITE_SERVICES_README.md`](docs/WEBSITE_SERVICES_README.md)**

- صفحات `/services` و `/services/providers/:id`
- عرض `menuItems` من البروفايل (عام — بدون token)
- سلة الطلب + `POST /services/orders`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | NestJS 10 (TypeScript) |
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| Auth | JWT (Passport) |
| OAuth | Google OAuth 2.0 |
| Password hashing | bcrypt (12 rounds) |
| Validation | class-validator |
| Rate limiting | @nestjs/throttler |
| API Docs | Swagger (OpenAPI) |

---

## Features

### Authentication Methods

1. **Email + Password** — register & login
2. **Phone + OTP** — send OTP → verify → auto register/login
3. **Google OAuth** — redirect to Google → callback with JWT

### OTP System

- Used for: phone auth & forgot password
- Expiration: **5 minutes**
- Single use only
- Rate limited on send endpoints

### Token System

- **Access token** — default 15 minutes
- **Refresh token** — default 7 days, hashed in DB
- Refresh tokens invalidated on password reset

### RBAC

- **Role** = grouping only
- **Permission** = controls access per action
- **Guards:** `JwtAuthGuard`, `PermissionsGuard`, `RolesGuard`

### Firebase Push Notifications

- In-app notification inbox (PostgreSQL) + optional **FCM push**
- Setup guide: [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md)

### Admin Panel APIs

- **Users:** list customers & owners (`users.read`) with email/profile filters
- **Owner KYC:** pending queue, approve/reject (`owner.review`)
- **Properties:** review queue, approve/reject (`property.review`)
- **Categories:** full CRUD for main categories & subcategories (`category.*`)

--- 

## Business Rules

- Admin can create properties as owner (has all permissions)
- Owner manages their own properties
- Customer only interacts with published properties
- No Broker role
- Users **cannot self-register as ADMIN** via API
- Admin is created via seed or manually
- **Register** requires: `name`, `email`, `phone`, `password`, `role` (`CUSTOMER` or `OWNER`)
- **Owner** registers with basic data → `profileStatus: INCOMPLETE`
- Owner completes extended profile → `KYC_PENDING` → Admin approves (`VERIFIED`) or rejects (`REJECTED`)
- Owner type (`INDIVIDUAL` / `COMPANY`) is chosen only when completing the profile

---

## Project Structure

```
aqar/
├── prisma/
│   ├── schema.prisma          # Database models
│   ├── seed.ts                # Roles, permissions, optional admin
│   └── migrations/            # SQL migrations
├── src/
│   ├── main.ts                # Bootstrap + Swagger + CORS
│   ├── app.module.ts
│   ├── config/
│   │   └── env.validation.ts  # Production env validation
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── token.service.ts
│   │   │   └── password.service.ts
│   │   ├── dto/
│   │   ├── guards/
│   │   │   ├── auth.guards.ts
│   │   │   └── google-auth.guard.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── google.strategy.ts
│   │   ├── otp/
│   │   │   └── otp.service.ts
│   │   └── decorators/
│   │       ├── permissions.decorator.ts
│   │       └── current-user.decorator.ts
│   ├── property/
│   │   └── property.controller.ts   # Example RBAC routes
│   ├── owner/
│   │   ├── owner.module.ts
│   │   ├── owner-profile.controller.ts
│   │   ├── owner-profile.service.ts
│   │   └── dto/
│   └── health/
│       └── health.module.ts         # GET /health
├── docker/
│   └── entrypoint.sh
├── Dockerfile
├── docker-compose.prod.yml
├── railway.toml
├── .env.example
└── .env.production.example
```

---

## Database Schema

### Models

| Model | Purpose |
|-------|---------|
| `User` | Accounts (email/phone/password/OAuth) |
| `Role` | ADMIN, OWNER, CUSTOMER |
| `Permission` | Action strings e.g. `property.create` |
| `RolePermission` | Many-to-many role ↔ permission |
| `Otp` | OTP codes with expiry & single-use flag |
| `OwnerProfile` | Owner KYC data (individual or company) |

### User Fields

```
id, name, email?, phone?, password?, provider, providerId?,
roleId, isVerified, refreshToken?, createdAt, updatedAt
```

### OwnerProfile Fields

```
id, userId, ownerType?, companyName?,
taxNumber? (image URL), commercialRegister? (image URL), nationalId? (image URL),
whatsapp?, phone?, email?, address?, city?, area?, bio?,
profileStatus, rejectionReason?, createdAt, updatedAt
```

### Enums

```
AuthProvider:  LOCAL | GOOGLE | PHONE
OtpPurpose:    PHONE_AUTH | PASSWORD_RESET
RoleName:      ADMIN | OWNER | CUSTOMER
OwnerType:     INDIVIDUAL | COMPANY
ProfileStatus: INCOMPLETE | BASIC_DONE | KYC_PENDING | VERIFIED | REJECTED
```

---

## RBAC & Permissions

### Permission List

| Permission | Description |
|------------|-------------|
| `users.create` | Create users |
| `users.read` | Read users |
| `users.update` | Update users |
| `users.delete` | Delete users |
| `property.create` | Create properties |
| `property.update` | Update properties |
| `property.delete` | Delete properties |
| `property.publish` | Submit properties for admin review |
| `property.read` | Read properties |
| `property.review` | Admin: approve/reject property submissions |
| `category.create` | Admin: create categories & subcategories |
| `category.update` | Admin: update categories & subcategories |
| `category.delete` | Admin: delete categories & subcategories |
| `category.read` | Admin: list all categories (including inactive) |
| `booking.create` | Create bookings |
| `booking.cancel` | Cancel bookings |
| `booking.read` | Read bookings |
| `owner.profile.read` | Read own owner profile |
| `owner.profile.update` | Complete/update own owner profile |
| `owner.review` | Admin: approve/reject owner KYC |

### Role → Permissions Matrix

| Permission | ADMIN | OWNER | CUSTOMER |
|------------|:-----:|:-----:|:--------:|
| users.* | ✅ | ❌ | ❌ |
| property.create/update/delete/publish | ✅ | ✅ | ❌ |
| property.read | ✅ | ✅ | ✅ |
| property.review | ✅ | ❌ | ❌ |
| category.create/update/delete/read | ✅ | ❌ | ❌ |
| booking.create/cancel | ✅ | ❌ | ✅ |
| booking.read | ✅ | ✅ | ✅ |
| owner.profile.read/update | ✅ | ✅ | ❌ |
| owner.review | ✅ | ❌ | ❌ |

> **ADMIN** receives every permission in the seed (`PERMISSIONS` array). Re-run `npm run prisma:seed` after adding new permissions so they are upserted and linked to the ADMIN role.

### Admin-only capabilities (by permission)

| Area | Permission | Endpoints |
|------|------------|-----------|
| Users | `users.read` | `GET /admin/customers`, `GET /admin/owners` |
| Owner KYC | `owner.review` | `GET /admin/owners/pending`, approve/reject |
| Properties | `property.review` | `GET /admin/properties/pending/list`, approve/reject |
| Properties | `property.read` | `GET /admin/properties` |
| Categories | `category.read` | `GET /admin/categories`, `GET /admin/categories/:parentId/subcategories`, `GET /admin/subcategories/:id` |
| Categories | `category.create` | `POST /admin/categories`, `POST /admin/categories/:parentId/subcategories` |
| Categories | `category.update` | `PATCH /admin/categories/:id`, `PATCH /admin/subcategories/:id` |
| Categories | `category.delete` | `DELETE /admin/categories/:id`, `DELETE /admin/subcategories/:id` |

### Decorators

```typescript
@Public()                              // Skip JWT
@RequirePermissions('property.create') // Permission check
@RequireRoles('ADMIN')                 // Role check
@CurrentUser()                         // Inject authenticated user
```

---

## Owner Profile & KYC

### Registration flow

```
1. POST /auth/register  (role: OWNER)
   → User created + OwnerProfile (profileStatus: INCOMPLETE)
   → Response includes: isProfileComplete: false

2. POST /owner/profile/complete  (ownerType: INDIVIDUAL | COMPANY)
   → profileStatus: KYC_PENDING

3. Admin reviews:
   PATCH /admin/owners/:userId/approve  → VERIFIED
   PATCH /admin/owners/:userId/reject   → REJECTED (+ reason)

4. If REJECTED → owner can resubmit POST /owner/profile/complete
```

### Profile status meanings

| Status | Meaning |
|--------|---------|
| `INCOMPLETE` | Owner registered but did not submit extended profile |
| `BASIC_DONE` | Reserved for future use |
| `KYC_PENDING` | Profile submitted, waiting for admin review |
| `VERIFIED` | Admin approved — owner can operate fully |
| `REJECTED` | Admin rejected — owner must fix and resubmit |

### Owner type fields

| Field | INDIVIDUAL | COMPANY |
|-------|:----------:|:-------:|
| `nationalId` | **Required** (image file) | — |
| `companyName` | — | **Required** (text) |
| `taxNumber` | — | **Required** (image file) |
| `commercialRegister` | — | **Required** (image file) |
| `whatsapp`, `phone`, `email`, `address`, `city`, `area`, `bio` | Optional | Optional |

> Stored document fields return **full image URLs** (e.g. `http://localhost:3000/uploads/kyc/...`).  
> Use them directly in `<img src="..." />` on the frontend. Legacy text values are returned as `null`.

---

## API Reference (Full)

**Base URL:** `http://localhost:3000` (dev) · `https://your-app.up.railway.app` (production)

**Auth header for protected routes:**
```
Authorization: Bearer <accessToken>
```

---

### POST `/auth/register` — Public

Register a new user (Customer or Owner).

**Request body:**

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `name` | string | ✅ | Full name |
| `email` | string | ✅ | Valid email (unique) |
| `phone` | string | ✅ | Phone number (unique), e.g. `+201234567890` |
| `password` | string | ✅ | Min 8 characters |
| `role` | enum | ✅ | `CUSTOMER` or `OWNER` only |

```json
{
  "name": "Ahmed Ali",
  "email": "owner@example.com",
  "phone": "+201234567890",
  "password": "password123",
  "role": "OWNER"
}
```

**Response `201`:**

```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {
    "id": "uuid",
    "name": "Ahmed Ali",
    "email": "owner@example.com",
    "phone": "+201234567890",
    "role": "OWNER",
    "isProfileComplete": false,
    "profileStatus": "INCOMPLETE",
    "ownerType": null
  }
}
```

> For `CUSTOMER`, owner fields (`isProfileComplete`, `profileStatus`, `ownerType`) are **not** included.

**Errors:**

| Status | Reason |
|--------|--------|
| `409` | Email or phone already registered |
| `400` | `role: ADMIN` not allowed |

---

### POST `/auth/login` — Public

**Request body:**

| Field | Type | Required |
|-------|------|:--------:|
| `email` | string | ✅ |
| `password` | string | ✅ |

```json
{
  "email": "owner@example.com",
  "password": "password123"
}
```

**Response `200`:** Same shape as register (includes owner flags if role is `OWNER`).

**Errors:** `401` Invalid credentials

---

### POST `/auth/phone/send-otp` — Public (rate limited)

**Request body:**

```json
{ "phone": "+201234567890" }
```

**Response `200`:**

```json
{ "message": "OTP sent successfully" }
```

> In development, OTP is printed in server console.

---

### POST `/auth/phone/verify` — Public

**Request body:**

| Field | Type | Required |
|-------|------|:--------:|
| `phone` | string | ✅ |
| `code` | string | ✅ |
| `name` | string | ✅ (for new users) |

```json
{
  "phone": "+201234567890",
  "code": "482913",
  "name": "Ahmed Ali"
}
```

**Response `200`:** Auth response (always registers as `CUSTOMER`).

---

### GET `/auth/google` — Public

Redirects browser to Google OAuth consent screen. No request body.

---

### GET `/auth/google/callback` — Public

Google callback. Redirects to:

```
{APP_URL}/auth/callback?accessToken=...&refreshToken=...
```

---

### POST `/auth/forgot-password` — Public (rate limited)

**Request body** (one of):

```json
{ "email": "user@example.com" }
```
```json
{ "phone": "+201234567890" }
```

**Response `200`:**

```json
{ "message": "If the account exists, an OTP has been sent" }
```

---

### POST `/auth/verify-reset-otp` — Public

**Request body:**

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response `200`:**

```json
{ "message": "OTP verified successfully" }
```

---

### POST `/auth/reset-password` — Public

**Request body:**

```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newPassword123"
}
```

**Response `200`:**

```json
{ "message": "Password reset successfully" }
```

> Invalidates all refresh tokens for the user.

---

### POST `/auth/refresh-token` — Public

**Request body:**

```json
{ "refreshToken": "eyJhbG..." }
```

**Response `200`:** Full auth response with new tokens.

---

### GET `/health` — Public

**Response `200`:**

```json
{
  "status": "ok",
  "timestamp": "2026-06-07T12:00:00.000Z"
}
```

---

### GET `/health/ready` — Public

**Response `200`:**

```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2026-06-07T12:00:00.000Z"
}
```

---

### GET `/owner/profile` — Protected (OWNER)

**Permission:** `owner.profile.read`

**Response `200`:**

```json
{
  "id": "profile-uuid",
  "userId": "user-uuid",
  "ownerType": "INDIVIDUAL",
  "companyName": null,
  "taxNumber": null,
  "commercialRegister": null,
  "nationalId": "http://localhost:3000/uploads/kyc/user-uuid/nationalId-abc.jpeg",
  "whatsapp": "+201098765432",
  "phone": "+201234567890",
  "email": "owner@example.com",
  "address": "123 Main St",
  "city": "Cairo",
  "area": "Nasr City",
  "bio": "Experienced owner",
  "profileStatus": "KYC_PENDING",
  "rejectionReason": null,
  "isProfileComplete": true,
  "isVerified": true,
  "createdAt": "2026-06-07T12:00:00.000Z",
  "updatedAt": "2026-06-07T12:30:00.000Z"
}
```

---

### POST `/owner/profile/complete` — Protected (OWNER)

**Permission:** `owner.profile.update`

Submit or resubmit extended owner profile. Sets `profileStatus` → `KYC_PENDING`.

**Content-Type:** `multipart/form-data`

**Request — INDIVIDUAL:**

| Field | Type | Required |
|-------|------|:--------:|
| `ownerType` | `INDIVIDUAL` | ✅ |
| `nationalId` | image file (JPEG/PNG/WebP, max 5 MB) | ✅ |
| `whatsapp`, `phone`, `email`, `address`, `city`, `area`, `bio` | text | Optional |

```bash
curl -X POST http://localhost:3000/owner/profile/complete \
  -H "Authorization: Bearer <accessToken>" \
  -F "ownerType=INDIVIDUAL" \
  -F "nationalId=@/path/to/national-id.jpg" \
  -F "whatsapp=+201098765432" \
  -F "city=Cairo"
```

**Request — COMPANY:**

| Field | Type | Required |
|-------|------|:--------:|
| `ownerType` | `COMPANY` | ✅ |
| `companyName` | text | ✅ |
| `taxNumber` | image file (JPEG/PNG/WebP, max 5 MB) | ✅ |
| `commercialRegister` | image file (JPEG/PNG/WebP, max 5 MB) | ✅ |
| `whatsapp`, `phone`, `email`, `address`, `city`, `area`, `bio` | text | Optional |

```bash
curl -X POST http://localhost:3000/owner/profile/complete \
  -H "Authorization: Bearer <accessToken>" \
  -F "ownerType=COMPANY" \
  -F "companyName=شركة العقارات المتميزة" \
  -F "taxNumber=@/path/to/tax-card.jpg" \
  -F "commercialRegister=@/path/to/cr-document.jpg" \
  -F "city=Cairo"
```

**Response `200`:**

```json
{
  "message": "Profile submitted for admin review",
  "profile": {
    "id": "profile-uuid",
    "userId": "user-uuid",
    "ownerType": "COMPANY",
    "companyName": "شركة العقارات المتميزة",
    "taxNumber": "http://localhost:3000/uploads/kyc/user-uuid/taxNumber-abc.jpeg",
    "commercialRegister": "http://localhost:3000/uploads/kyc/user-uuid/commercialRegister-abc.jpeg",
    "nationalId": null,
    "profileStatus": "KYC_PENDING",
    "isProfileComplete": true,
    "...": "..."
  }
}
```

**Errors:**

| Status | Reason |
|--------|--------|
| `400` | Missing required document image (first submit) |
| `400` | Already `VERIFIED` |
| `403` | Not an owner |

---

### GET `/admin/owners/pending` — Protected (ADMIN)

**Permission:** `owner.review`

**Response `200`:**

```json
[
  {
    "id": "profile-uuid",
    "userId": "user-uuid",
    "ownerType": "COMPANY",
    "companyName": "شركة العقارات",
    "profileStatus": "KYC_PENDING",
    "isProfileComplete": true,
    "user": {
      "id": "user-uuid",
      "name": "Ahmed Ali",
      "email": "owner@example.com",
      "phone": "+201234567890",
      "createdAt": "2026-06-07T12:00:00.000Z"
    }
  }
]
```

---

### PATCH `/admin/owners/:userId/approve` — Protected (ADMIN)

**Permission:** `owner.review`

**Request body:** None

**Response `200`:**

```json
{
  "message": "Owner profile approved",
  "profile": {
    "profileStatus": "VERIFIED",
    "rejectionReason": null,
    "...": "..."
  }
}
```

---

### PATCH `/admin/owners/:userId/reject` — Protected (ADMIN)

**Permission:** `owner.review`

**Request body:**

```json
{
  "reason": "وثيقة السجل التجاري غير صحيحة"
}
```

**Response `200`:**

```json
{
  "message": "Owner profile rejected",
  "profile": {
    "profileStatus": "REJECTED",
    "rejectionReason": "وثيقة السجل التجاري غير صحيحة",
    "...": "..."
  }
}
```

---

### GET `/properties` — Protected

**Permission:** `property.read`

**Response `200`:**

```json
{
  "message": "Published properties visible to authenticated users with property.read",
  "requestedBy": { "id": "user-uuid", "role": "CUSTOMER" }
}
```

---

### POST `/properties` — Protected

**Permission:** `property.create`

**Request body:** Any JSON (example)

```json
{ "title": "Villa in New Cairo", "price": 5000 }
```

**Response `201`:**

```json
{
  "message": "Property created",
  "ownerId": "user-uuid",
  "data": { "title": "Villa in New Cairo", "price": 5000 }
}
```

---

### PATCH `/properties/:id` — Protected

**Permission:** `property.update`

**Request body:** Fields to update

**Response `200`:**

```json
{
  "message": "Property {id} updated by owner",
  "ownerId": "user-uuid",
  "data": { }
}
```

---

### POST `/properties/:id/publish` — Protected

**Permission:** `property.publish`

**Response `200`:**

```json
{
  "message": "Property {id} published",
  "publishedBy": "user-uuid"
}
```

---

### DELETE `/properties/:id` — Protected

**Permission:** `property.delete`

**Response `200`:**

```json
{
  "message": "Property {id} deleted",
  "deletedBy": "user-uuid"
}
```

---

### GET `/properties/admin/all` — Protected (ADMIN)

**Permission:** `property.read` + role `ADMIN`

**Response `200`:**

```json
{
  "message": "Admin-only: all properties including drafts",
  "adminId": "user-uuid"
}
```

---

### POST `/bookings` — Protected

**Permission:** `booking.create`

**Request body:**

```json
{ "propertyId": "property-uuid", "startDate": "2026-07-01", "endDate": "2026-07-05" }
```

**Response `201`:**

```json
{
  "message": "Booking created",
  "customerId": "user-uuid",
  "data": { }
}
```

---

### GET `/bookings/my` — Protected

**Permission:** `booking.read`

**Response `200`:**

```json
{
  "message": "Your bookings",
  "userId": "user-uuid"
}
```

---

### PATCH `/bookings/:id/cancel` — Protected

**Permission:** `booking.cancel`

**Response `200`:**

```json
{
  "message": "Booking {id} cancelled",
  "cancelledBy": "user-uuid"
}
```

---

## API Endpoints (Summary)

| Method | Endpoint | Auth | Permission / Role |
|--------|----------|:----:|-----------------|
| POST | `/auth/register` | — | Public |
| POST | `/auth/login` | — | Public |
| POST | `/auth/phone/send-otp` | — | Public |
| POST | `/auth/phone/verify` | — | Public |
| GET | `/auth/google` | — | Public |
| GET | `/auth/google/callback` | — | Public |
| POST | `/auth/forgot-password` | — | Public |
| POST | `/auth/verify-reset-otp` | — | Public |
| POST | `/auth/reset-password` | — | Public |
| POST | `/auth/refresh-token` | — | Public |
| GET | `/health` | — | Public |
| GET | `/health/ready` | — | Public |
| GET | `/auth/me` | JWT | Current user + permissions |
| GET | `/categories` | — | Public category tree |
| GET | `/categories/:slug` | — | Public category by slug |
| GET | `/notifications` | JWT | Paginated notification inbox |
| GET | `/notifications/unread-count` | JWT | Unread count |
| PATCH | `/notifications/:id/read` | JWT | Mark notification read |
| PATCH | `/notifications/read-all` | JWT | Mark all read |
| POST | `/notifications/devices/register` | JWT | Register FCM token |
| DELETE | `/notifications/devices/:token` | JWT | Remove FCM token |
| GET | `/owner/profile` | JWT | `owner.profile.read` |
| POST | `/owner/profile/complete` | JWT | `owner.profile.update` |
| GET | `/admin/customers` | JWT | ADMIN + `users.read` |
| GET | `/admin/owners` | JWT | ADMIN + `users.read` |
| GET | `/admin/owners/pending` | JWT | `owner.review` |
| PATCH | `/admin/owners/:userId/approve` | JWT | `owner.review` |
| PATCH | `/admin/owners/:userId/reject` | JWT | `owner.review` |
| GET | `/admin/categories` | JWT | ADMIN + `category.read` |
| GET | `/admin/categories/:id` | JWT | ADMIN + `category.read` |
| POST | `/admin/categories` | JWT | ADMIN + `category.create` |
| PATCH | `/admin/categories/:id` | JWT | ADMIN + `category.update` |
| DELETE | `/admin/categories/:id` | JWT | ADMIN + `category.delete` |
| GET | `/admin/categories/:parentId/subcategories` | JWT | ADMIN + `category.read` |
| POST | `/admin/categories/:parentId/subcategories` | JWT | ADMIN + `category.create` |
| GET | `/admin/subcategories/:id` | JWT | ADMIN + `category.read` |
| PATCH | `/admin/subcategories/:id` | JWT | ADMIN + `category.update` |
| DELETE | `/admin/subcategories/:id` | JWT | ADMIN + `category.delete` |
| GET | `/admin/properties` | JWT | ADMIN + `property.read` |
| GET | `/admin/properties/pending/list` | JWT | `property.review` |
| PATCH | `/admin/properties/:id/approve` | JWT | `property.review` |
| PATCH | `/admin/properties/:id/reject` | JWT | `property.review` |
| GET | `/properties` | — | Public approved catalog |
| GET | `/properties/:id` | Optional | Approved; owner/admin see all statuses |
| GET | `/properties/my/list` | JWT | `property.read` |
| POST | `/properties` | JWT | `property.create` |
| PATCH | `/properties/:id` | JWT | `property.update` |
| POST | `/properties/:id/submit` | JWT | `property.publish` |
| DELETE | `/properties/:id` | JWT | `property.delete` |
| POST | `/bookings` | JWT | `booking.create` |
| GET | `/bookings/my` | JWT | `booking.read` |
| PATCH | `/bookings/:id/cancel` | JWT | `booking.cancel` |

---

## Swagger Documentation

Interactive API docs available at:

```
http://localhost:3000/api/docs
```

**How to use:**

1. Call `POST /auth/login` or `POST /auth/register`
2. Copy `accessToken` from response
3. Click **Authorize** → enter: `Bearer <accessToken>`
4. Test protected endpoints

> In production, Swagger is **disabled by default** (`SWAGGER_ENABLED=false`).

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `NODE_ENV` | No | `development` | `development` or `production` |
| `PORT` | No | `3000` | Server port (Railway sets automatically) |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | **Yes** (prod) | — | Min 32 chars |
| `JWT_REFRESH_SECRET` | **Yes** (prod) | — | Min 32 chars |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token TTL |
| `APP_URL` | **Yes** (prod) | — | Public API URL |
| `CORS_ORIGIN` | No | `*` | Comma-separated allowed origins |
| `SWAGGER_ENABLED` | No | `false` in prod | Enable `/api/docs` |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth secret |
| `GOOGLE_CALLBACK_URL` | No | — | Must match Google Console |
| `OTP_EXPIRY_MINUTES` | No | `5` | OTP expiration |
| `OTP_RATE_LIMIT_TTL` | No | `60` | Rate limit window (seconds) |
| `OTP_RATE_LIMIT_MAX` | No | `3` | Max OTP requests per window |
| `RESEND_API_KEY` | No | — | [Resend](https://resend.com) API key for verification emails |
| `RESEND_FROM` | No | `Aqar <onboarding@resend.dev>` | Sender address (`onboarding@resend.dev` for dev only) |
| `FIREBASE_PROJECT_ID` | No | — | Firebase project ID (FCM push) |
| `FIREBASE_CLIENT_EMAIL` | No | — | Service account email |
| `FIREBASE_PRIVATE_KEY` | No | — | Service account private key (quoted, `\n` for newlines) |
| `SEED_ADMIN` | No | `false` | Create admin on seed |
| `ADMIN_EMAIL` | If seed | — | Admin email |
| `ADMIN_PASSWORD` | If seed | — | Admin password (min 12 chars) |
| `RUN_SEED` | No | `false` | Run seed on Docker start |

Copy `.env.example` for local development:

```bash
cp .env.example .env
```

---

## Local Development

### Prerequisites

- Node.js 22+
- PostgreSQL (local, Docker, or `npx prisma dev`)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit DATABASE_URL and secrets

# 3. Run migrations
npx prisma migrate dev

# 4. Seed roles, permissions & admin
npm run prisma:seed

# 5. Start dev server
npm run start:dev
```

### URLs (local)

| URL | Description |
|-----|-------------|
| http://localhost:3000 | API |
| http://localhost:3000/api/docs | Swagger |
| http://localhost:3000/health | Health check |

---

## Deploy on Railway

### Step 1 — Create Railway Project

1. Go to [railway.app](https://railway.app) and create a new project
2. Click **New** → **GitHub Repo** → select this repository
3. Click **New** → **Database** → **PostgreSQL**
4. Railway auto-creates `DATABASE_URL` — link it to your service

### Step 2 — Configure Environment Variables

In Railway → your service → **Variables**, add:

```env
NODE_ENV=production
JWT_ACCESS_SECRET=<generate-64-random-chars>
JWT_REFRESH_SECRET=<generate-64-random-chars>
APP_URL=https://<your-service>.up.railway.app
CORS_ORIGIN=https://your-frontend.com
SWAGGER_ENABLED=false

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://<your-service>.up.railway.app/auth/google/callback

# OTP
OTP_EXPIRY_MINUTES=5
OTP_RATE_LIMIT_TTL=60
OTP_RATE_LIMIT_MAX=3
```

> `DATABASE_URL` is injected automatically when you link the PostgreSQL plugin.

> `PORT` is set automatically by Railway — do not hardcode it.

### Step 3 — Build & Start Commands

Railway reads `railway.toml` automatically:

```toml
buildCommand = "npm ci && npx prisma generate && npm run build"
startCommand  = "npx prisma migrate deploy && node dist/src/main.js"
healthcheckPath = "/health"
```

Or set manually in Railway → Settings → Deploy:

| Setting | Value |
|---------|-------|
| **Build Command** | `npm ci && npx prisma generate && npm run build` |
| **Start Command** | `npm run start:railway` |
| **Health Check** | `/health` |

### Step 4 — First Deploy: Seed Database

After first successful deploy, run seed **once** via Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login & link project
railway login
railway link

# Run seed with admin credentials
railway run --service <your-api-service> \
  env SEED_ADMIN=true ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=YourStrongPassword123 \
  node dist/prisma/seed.js
```

Or from Railway dashboard → service → **Settings** → run one-off command with same env vars.

> After seeding, remove `SEED_ADMIN` / admin credentials from any persistent config.

### Step 5 — Custom Domain (optional)

1. Railway → service → **Settings** → **Networking** → **Generate Domain**
2. Or add custom domain → update `APP_URL` and `GOOGLE_CALLBACK_URL`
3. Update `CORS_ORIGIN` with your frontend domain

### Step 6 — Verify Deployment

```bash
curl https://<your-service>.up.railway.app/health
# Expected: {"status":"ok","timestamp":"..."}

curl -X POST https://<your-service>.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"YourStrongPassword123"}'
```

---

## Deploy with Docker

For VPS or self-hosted:

```bash
cp .env.production.example .env.production
# Fill all values

npm run docker:prod:up
```

Stop:

```bash
npm run docker:prod:down
```

Docker automatically runs migrations on start. Set `RUN_SEED=true` only on first deploy.

---

## Admin & Seed

### What the seed creates

- All permissions
- Roles: ADMIN, OWNER, CUSTOMER
- Role-permission mappings
- Admin user (only if `SEED_ADMIN=true`)

### Development defaults

When `SEED_ADMIN=true` in `.env`:

| Field | Value |
|-------|-------|
| Email | `admin@aqar.com` |
| Password | `Admin@123456` |

### Production

Never use dev credentials. Set strong values:

```env
SEED_ADMIN=true
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=MinimumTwelveChars!
```

Run seed once, then disable `SEED_ADMIN`.

---

## Auth Flows

### 1. Customer Register & Login

```bash
# Register as CUSTOMER
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmed",
    "email": "customer@test.com",
    "phone": "+201111111111",
    "password": "password123",
    "role": "CUSTOMER"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"password123"}'
```

### 2. Owner Register → Complete Profile → Admin Review

```bash
# Step 1: Register as OWNER (basic data only)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mohamed Owner",
    "email": "owner@test.com",
    "phone": "+201222222222",
    "password": "password123",
    "role": "OWNER"
  }'
# → isProfileComplete: false, profileStatus: INCOMPLETE

# Step 2: Complete profile (use accessToken from verify-email)
curl -X POST http://localhost:3000/owner/profile/complete \
  -H "Authorization: Bearer <accessToken>" \
  -F "ownerType=INDIVIDUAL" \
  -F "nationalId=@/path/to/national-id.jpg" \
  -F "city=Cairo" \
  -F "area=Nasr City"
# → profileStatus: KYC_PENDING

# Step 3: Admin approves
curl -X PATCH http://localhost:3000/admin/owners/<userId>/approve \
  -H "Authorization: Bearer <adminAccessToken>"
# → profileStatus: VERIFIED
```

### 3. Phone OTP

```bash
# Step 1: Send OTP
curl -X POST http://localhost:3000/auth/phone/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+201234567890"}'

# Step 2: Check server logs for OTP code (dev only)
# [OtpService] OTP for +201234567890 (PHONE_AUTH): 482913

# Step 3: Verify
curl -X POST http://localhost:3000/auth/phone/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"+201234567890","code":"482913","name":"Ahmed Ali"}'
```

### 4. Google OAuth

1. Configure Google Cloud Console → OAuth 2.0 credentials
2. Set authorized redirect URI: `{APP_URL}/auth/google/callback`
3. Visit: `GET /auth/google`
4. After consent, redirects to `{APP_URL}/auth/callback?accessToken=...&refreshToken=...`

### 5. Password Reset

```bash
# 1. Request OTP
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@test.com"}'

# 2. Verify OTP
curl -X POST http://localhost:3000/auth/verify-reset-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@test.com","code":"123456"}'

# 3. Reset password
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@test.com","code":"123456","newPassword":"newPassword123"}'
```

### 6. Using JWT on Protected Routes

```bash
curl http://localhost:3000/properties \
  -H "Authorization: Bearer <accessToken>"
```

### 7. Refresh Token

```bash
curl -X POST http://localhost:3000/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

---

## Security

| Rule | Implementation |
|------|----------------|
| Password hashing | bcrypt, 12 salt rounds |
| OTP expiry | 5 minutes |
| OTP single use | `usedAt` timestamp |
| OTP rate limit | ThrottlerGuard on send endpoints |
| Refresh token storage | Hashed in DB |
| Password reset | Invalidates all refresh tokens |
| Admin self-register | Blocked in API |
| Production env | Validated on startup |
| Swagger in prod | Disabled by default |
| CORS | Configurable via `CORS_ORIGIN` |

### Generate secure secrets

```bash
# Linux / macOS / Git Bash
openssl rand -base64 48

# PowerShell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run start:prod` | Run compiled app |
| `npm run start:railway` | Migrate + start (Railway) |
| `npm run prisma:migrate` | Create/apply dev migrations |
| `npm run prisma:migrate:deploy` | Apply migrations (production) |
| `npm run prisma:seed` | Seed DB (development) |
| `npm run prisma:seed:prod` | Seed DB (production build) |
| `npm run docker:prod:up` | Start Docker production stack |
| `npm run docker:prod:down` | Stop Docker production stack |

---

## Production Checklist

- [ ] Strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (64+ chars)
- [ ] Strong admin password (12+ chars)
- [ ] `SWAGGER_ENABLED=false`
- [ ] `NODE_ENV=production`
- [ ] `APP_URL` matches Railway public URL
- [ ] `CORS_ORIGIN` set to frontend domain only
- [ ] Google OAuth callback URL updated
- [ ] SMS provider integrated for OTP (Twilio, Unifonic, etc.)
- [ ] Seed run once, then `SEED_ADMIN=false`
- [ ] Custom domain + HTTPS configured
- [ ] Database backups enabled (Railway PostgreSQL plugin)

---

## Troubleshooting

### `Can't reach database server`

- Verify `DATABASE_URL` is set and PostgreSQL service is running
- On Railway: ensure PostgreSQL plugin is linked to API service
- **Neon:** open [Neon Console](https://console.neon.tech) and wake the project if suspended (free tier sleeps)
- **Neon + Prisma:** set `DIRECT_URL` to the **direct** connection string (host without `-pooler`) for `migrate` / `seed`
- Remove `channel_binding=require` from connection strings if Prisma fails on Windows
- Retry once after waking Neon — first connection can take 5–10 seconds

### `P1001` / connection closed (Prisma dev)

- If using `prisma dev`, add `?pgbouncer=true` to `DATABASE_URL`

### Uploaded images return 404 on Railway

Railway uses an **ephemeral filesystem** — files in `/app/uploads` are **deleted on every redeploy**.

**Recommended — Cloudinary:**

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Add Railway variables: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
3. Redeploy, then **re-upload** logos and listing images (old `/uploads/...` URLs in the database no longer exist on disk)

New uploads return `https://res.cloudinary.com/...` URLs that persist.

**Alternative — Railway Volume:** mount a volume at `/app/uploads`, redeploy, re-upload.

### `401 Authentication required`

- Missing or expired JWT
- Use `POST /auth/refresh-token` or login again

### `403 Insufficient permissions`

- User role lacks required permission
- Check RBAC matrix above

### OTP not received

- In development, OTP is logged to server console
- In production, integrate SMS provider in `src/auth/otp/otp.service.ts`

### Railway build fails

- Ensure `buildCommand` includes `npx prisma generate`
- Check Node.js version (22+ recommended)

### Health check failing

- Verify `/health` returns 200
- Check DB connectivity via `DATABASE_URL`

---

## License

Private — Aqar Rental Property Platform.