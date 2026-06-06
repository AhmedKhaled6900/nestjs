# Aqar — Rental Property Platform API

Production-grade **Authentication + Authorization (RBAC)** backend for a rental property platform.

Built with **NestJS**, **PostgreSQL**, **Prisma**, **JWT**, **Phone OTP**, and **Google OAuth**.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Business Rules](#business-rules)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [RBAC & Permissions](#rbac--permissions)
- [API Endpoints](#api-endpoints)
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
- Example protected routes for Properties & Bookings

**User roles:**

| Role | Description |
|------|-------------|
| `ADMIN` | Full system access |
| `OWNER` | Manages own properties |
| `CUSTOMER` | Views published properties, creates bookings |

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
- Guards: `JwtAuthGuard`, `PermissionsGuard`, `RolesGuard`

---

## Business Rules

- Admin can create properties as owner (has all permissions)
- Owner manages their own properties
- Customer only interacts with published properties
- No Broker role
- Users **cannot self-register as ADMIN** via API
- Admin is created via seed or manually

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

### User Fields

```
id, name, email?, phone?, password?, provider, providerId?,
roleId, isVerified, refreshToken?, createdAt, updatedAt
```

### Enums

```
AuthProvider: LOCAL | GOOGLE | PHONE
OtpPurpose:   PHONE_AUTH | PASSWORD_RESET
RoleName:     ADMIN | OWNER | CUSTOMER
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
| `property.publish` | Publish properties |
| `property.read` | Read properties |
| `booking.create` | Create bookings |
| `booking.cancel` | Cancel bookings |
| `booking.read` | Read bookings |

### Role → Permissions Matrix

| Permission | ADMIN | OWNER | CUSTOMER |
|------------|:-----:|:-----:|:--------:|
| users.* | ✅ | ❌ | ❌ |
| property.create/update/delete/publish | ✅ | ✅ | ❌ |
| property.read | ✅ | ✅ | ✅ |
| booking.create/cancel | ✅ | ❌ | ✅ |
| booking.read | ✅ | ✅ | ✅ |

### Decorators

```typescript
@Public()                              // Skip JWT
@RequirePermissions('property.create') // Permission check
@RequireRoles('ADMIN')                 // Role check
@CurrentUser()                         // Inject authenticated user
```

---

## API Endpoints

Base URL: `http://localhost:3000` (dev) or `https://your-app.up.railway.app` (production)

### Auth — Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register with email & password |
| POST | `/auth/login` | Login with email & password |
| POST | `/auth/phone/send-otp` | Send OTP to phone (rate limited) |
| POST | `/auth/phone/verify` | Verify OTP → register or login |
| GET | `/auth/google` | Start Google OAuth |
| GET | `/auth/google/callback` | Google OAuth callback |
| POST | `/auth/forgot-password` | Send reset OTP (email or phone) |
| POST | `/auth/verify-reset-otp` | Verify reset OTP |
| POST | `/auth/reset-password` | Set new password |
| POST | `/auth/refresh-token` | Refresh JWT tokens |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (DB connectivity) |

### Properties — Protected (Bearer JWT)

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/properties` | `property.read` |
| POST | `/properties` | `property.create` |
| PATCH | `/properties/:id` | `property.update` |
| POST | `/properties/:id/publish` | `property.publish` |
| DELETE | `/properties/:id` | `property.delete` |
| GET | `/properties/admin/all` | ADMIN + `property.read` |

### Bookings — Protected (Bearer JWT)

| Method | Endpoint | Permission |
|--------|----------|------------|
| POST | `/bookings` | `booking.create` |
| GET | `/bookings/my` | `booking.read` |
| PATCH | `/bookings/:id/cancel` | `booking.cancel` |

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

### 1. Email Register & Login

```bash
# Register (CUSTOMER or OWNER only — not ADMIN)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ahmed","email":"ahmed@test.com","password":"password123","role":"CUSTOMER"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@test.com","password":"password123"}'
```

### 2. Phone OTP

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

### 3. Google OAuth

1. Configure Google Cloud Console → OAuth 2.0 credentials
2. Set authorized redirect URI: `{APP_URL}/auth/google/callback`
3. Visit: `GET /auth/google`
4. After consent, redirects to `{APP_URL}/auth/callback?accessToken=...&refreshToken=...`

### 4. Password Reset

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

### 5. Using JWT on Protected Routes

```bash
curl http://localhost:3000/properties \
  -H "Authorization: Bearer <accessToken>"
```

### 6. Refresh Token

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

### `P1001` / connection closed (Prisma dev)

- If using `prisma dev`, add `?pgbouncer=true` to `DATABASE_URL`

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
#   n e s t j s  
 