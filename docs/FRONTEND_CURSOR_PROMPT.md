# Aqar Frontend — Cursor Implementation Prompt

Copy this entire file into a **new Cursor chat** in the frontend project.

---

## API Sources (read before coding)

1. **OpenAPI spec (primary):** `docs/openapi.json` or `openapi.json` from backend repo  
   Live JSON (dev server running): `GET http://localhost:3000/api/docs-json`
2. **Swagger UI (human testing):** `http://localhost:3000/api/docs`
3. **Backend source (if monorepo / both repos open):**
   - Controllers: `e:\aqar\src\**\*.controller.ts`
   - DTOs: `e:\aqar\src\**\dto\*.ts`
4. **Do NOT guess** request/response shapes — use openapi.json or controller source.

Regenerate spec after backend changes:
```bash
cd e:\aqar && npm run openapi:export
```

---

## Tech Stack (MUST follow)

- **Build:** Vite 8 + `@vitejs/plugin-react` + React Compiler
- **Routing:** `react-router-dom` v7 (`createBrowserRouter`, **no `App.tsx`**)
- **Server state:** TanStack React Query v5
- **HTTP:** Axios via `src/hooks/useAxiosInstance.tsx`
- **UI:** Tailwind CSS 4 + shadcn/ui (primary)
- **Forms:** Yup validation
- **i18n:** i18next — default **Arabic**, RTL via `dir="rtl"`
- **Auth:** js-cookie (tokens) + localStorage (`permissions` array)
- **Alias:** `@` → `src/`

### Reuse existing patterns
- Login: `src/pages/auth/hooks/useStoreLogin.tsx`
- Tokens: `src/lib/token-managament/useCookies.tsx`
- Guard: `src/router/ProtectedRoute.tsx` (`access_token`)
- Permission route: `src/routes/PermissionGuard.tsx`
- Check: `useCookies().hasPermission(permission)`

### Design
- Brand: `#005BAA` (`--color-main`)
- `cn()` for conditional classes
- All UI labels in Arabic (i18next)

```env
VITE_API_URL=http://localhost:3000
```

---

## Authentication

### Headers
```
Authorization: Bearer <accessToken>   // protected routes
Content-Type: application/json      // JSON only (not multipart)
```

### Token storage
After `login`, `verify-email`, or `refresh-token`:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id", "name", "email", "phone", "role", "isVerified", ... },
  "permissions": ["property.read", "booking.create", ...]
}
```
**Store `permissions` in localStorage** — comes from server (not hardcoded).

### Session restore on app load
```
GET /auth/me
Authorization: Bearer <accessToken>
```
Response:
```json
{
  "user": { "id", "name", "email", "phone", "role", "isVerified",
    "isProfileComplete?", "profileStatus?", "ownerType?" },
  "permissions": ["property.read", ...]
}
```
Use React Query with key `['auth', 'me']` on app bootstrap.

### Refresh
`POST /auth/refresh-token` body: `{ "refreshToken" }` → same shape as login (includes `permissions`).

---

## Auth Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/auth/register` | Public | No tokens. Redirect to verify-email |
| POST | `/auth/verify-email` | Public | `{ email, code }` → tokens + permissions |
| POST | `/auth/resend-verification` | Public | Rate limited 3/min |
| POST | `/auth/login` | Public | 403 if email not verified |
| POST | `/auth/refresh-token` | Public | |
| GET | `/auth/me` | Bearer | Current user + permissions |
| POST | `/auth/forgot-password` | Public | |
| POST | `/auth/verify-reset-otp` | Public | |
| POST | `/auth/reset-password` | Public | |
| POST | `/auth/phone/send-otp` | Public | |
| POST | `/auth/phone/verify` | Public | |

### Register body
```json
{ "name", "email", "phone", "password" (min 8), "role": "CUSTOMER" | "OWNER" }
```

### Login 403 (unverified)
```json
{ "message": "Email not verified...", "isVerified": false }
```
→ redirect `/auth/verify-email`

---

## Pagination (ALL list GET endpoints)

Every list endpoint uses the same shape:

**Query params:** `page` (default `1`), `limit` (default `20`, max `100`)

**Response:**
```json
{
  "items": [ /* full objects — all fields */ ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Paginated endpoints:**
| GET | Extra filters |
|-----|---------------|
| `/categories` | — |
| `/properties` | `purpose`, `categoryId`, `city` |
| `/properties/my/list` | `status` |
| `/admin/properties` | `status` |
| `/admin/properties/pending/list` | — |
| `/admin/owners/pending` | — |

---

## Firebase Push (FCM only)

Push via **Firebase Cloud Messaging** — no in-app notification inbox API.

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/notifications/devices/register` | Bearer | Register FCM token |
| DELETE | `/notifications/devices/:token` | Bearer | Remove token on logout |

### Register device (after login)
```json
POST /notifications/devices/register
{ "token": "<fcm-registration-token>", "platform": "web" | "android" | "ios" }
```

### FCM payload `data` fields
```json
{
  "type": "OWNER_KYC_APPROVED",
  "userId": "uuid",
  "createdAt": "ISO-8601",
  "payload": "{...optional JSON string...}"
}
```

### Frontend Firebase setup (web)

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

```bash
npm install firebase
```

```ts
export async function registerFcmToken(api: AxiosInstance) {
  const messaging = getMessaging(firebaseApp);
  const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
  if (token) {
    await api.post('/notifications/devices/register', { token, platform: 'web' });
  }
  onMessage(messaging, (payload) => {
    // show toast / navigate based on payload.data.type
  });
}
```

Call after login. On logout → `DELETE /notifications/devices/:token`.

Backend setup: `docs/FIREBASE_SETUP.md`

---

## Categories (Public)

| GET | `/categories` | Full tree (main + subcategories) |
| GET | `/categories/:slug` | Single category |

**Important:** When creating a property, `categoryId` must be a **subcategory UUID** (leaf), not main category.

---

## Owner Profile (OWNER + Bearer)

| GET | `/owner/profile` | `owner.profile.read` |
| POST | `/owner/profile/complete` | `owner.profile.update` — **multipart/form-data** |

### KYC multipart fields
**INDIVIDUAL:** `ownerType=INDIVIDUAL`, `nationalId` = image file (required)  
**COMPANY:** `ownerType=COMPANY`, `companyName`, `taxNumber` file, `commercialRegister` file  

Optional: `whatsapp`, `phone`, `email`, `address`, `city`, `area`, `bio`

Response document fields are **full image URLs**:
```json
"nationalId": "http://localhost:3000/uploads/kyc/{userId}/nationalId-xxx.jpeg"
```

### Profile statuses
| Status | UX |
|--------|-----|
| `INCOMPLETE` | Force complete-profile wizard |
| `KYC_PENDING` | Waiting screen |
| `REJECTED` | Show `rejectionReason` + resubmit |
| `VERIFIED` | Allow property creation |

`isVerified` on profile = email verified (separate from KYC).

---

## Properties — Public

| GET | `/properties` | Filters: `purpose`, `categoryId`, `city`, `page`, `limit` |
| GET | `/properties/:id` | Approved only |

Response images:
```json
"images": [{ "id", "imageUrl": "http://localhost:3000/uploads/...", "isPrimary", "order" }]
```

---

## Properties — Owner (KYC VERIFIED required)

| POST | `/properties` | `property.create` — creates DRAFT |
| GET | `/properties/my/list` | `property.read` — all statuses |
| PATCH | `/properties/:id` | `property.update` — DRAFT/REJECTED only |
| DELETE | `/properties/:id` | `property.delete` — DRAFT/REJECTED only |
| POST | `/properties/:id/images` | `property.update` — multipart `images[]`, optional `primaryIndex` |
| PATCH | `/properties/:id/images/:imageId` | `{ isPrimary?, order? }` |
| DELETE | `/properties/:id/images/:imageId` | |
| POST | `/properties/:id/submit` | `property.publish` — needs ≥1 image → PENDING |
| PATCH | `/properties/:id/mark-sold` | APPROVED + SALE |
| PATCH | `/properties/:id/mark-rented` | APPROVED + RENT |

### Create property body
```json
{
  "title" (min 5), "description" (min 20), "price",
  "city", "area", "address",
  "latitude?", "longitude?", "bedrooms?", "bathrooms?", "areaSize?",
  "purpose": "SALE" | "RENT",
  "categoryId": "<subcategory-uuid>"
}
```

### Property statuses
`DRAFT` → `PENDING` → `APPROVED` | `REJECTED` → `SOLD` | `RENTED`

---

## Admin

| GET | `/admin/owners/pending` | `owner.review` — paginated, includes `isVerified` + full profile + `user` |
| PATCH | `/admin/owners/:userId/approve` | |
| PATCH | `/admin/owners/:userId/reject` | `{ reason }` |
| GET | `/admin/properties` | `property.read` + ADMIN role |
| GET | `/admin/properties/pending/list` | `property.review` |
| PATCH | `/admin/properties/:id/approve` | |
| PATCH | `/admin/properties/:id/reject` | `{ reason }` |

---

## Pages to Build

### Public
- `/` — home + approved properties
- `/properties` — catalog + filters
- `/properties/:id` — detail + gallery

### Auth
- `/auth/login`, `/auth/register`, `/auth/verify-email`, `/auth/forgot-password`

### Owner
- `/owner/dashboard`
- `/owner/complete-profile` (multipart KYC)
- `/owner/profile`
- `/owner/properties/new`
- `/owner/properties/:id/edit` (form + images + submit)

### Admin
- `/admin/owners/pending`
- `/admin/properties/pending`
- `/admin/properties`

---

## Post-login redirect logic

```ts
if (!user.isVerified) → /auth/verify-email

if (role === 'OWNER') {
  if (profileStatus === 'INCOMPLETE' || profileStatus === 'REJECTED') → /owner/complete-profile
  if (profileStatus === 'KYC_PENDING') → /owner/pending-review
  if (profileStatus === 'VERIFIED') → /owner/dashboard
}

if (role === 'ADMIN') → /admin/owners/pending
if (role === 'CUSTOMER') → /
```

---

## React Query hooks to create

```
src/features/auth/
  useLogin, useRegister, useVerifyEmail, useResendVerification, useMe, useRefreshToken

src/features/categories/useCategories.ts
src/features/properties/  (useProperties, useProperty, useMyProperties, CRUD, images, submit)
src/features/owner/       (useOwnerProfile, useCompleteOwnerProfile)
src/features/admin/       (pending owners/properties, approve, reject)
src/features/notifications/ (useRegisterFcm, onMessage handler)
```

### useMe example
```ts
export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await axios.get('/auth/me');
      localStorage.setItem('permissions', JSON.stringify(data.permissions));
      return data;
    },
    enabled: !!getAccessToken(),
  });
}
```

---

## Implementation phases

1. **Auth** — login, register, verify-email, me, refresh, permission storage
2. **Public catalog** — categories, properties list/detail
3. **Owner KYC** — multipart complete-profile
4. **Owner properties** — CRUD, images, submit
5. **Admin** — owner + property review panels
6. **Firebase push** — FCM token registration after auth

---

## Rules

### DO
- Read `openapi.json` before implementing endpoints
- Use multipart for KYC and property images
- Store server `permissions` in localStorage on login/me/refresh
- Arabic UI + RTL on every page
- Reuse `useAxiosInstance`, `useCookies`, guards

### DO NOT
- Hardcode permission lists (use API `permissions` array)
- Send images as JSON strings
- Use main category ID as `categoryId`
- Expect tokens on register (only after verify-email)
- Create `App.tsx`
