# Service Provider Module — Dashboard Frontend Guide

> **الغرض:** هذا الملف مخصص لنسخه إلى مشروع الداشبورد (Cursor) لبناء **لوحة مقدم الخدمة (Provider Portal)** ضد الـ API الحالي.  
> **Backend repo:** `aqar` — NestJS API  
> **Swagger (dev):** `http://localhost:3000/api/docs`  
> **OpenAPI:** شغّل `npm run openapi:export` من الـ backend ثم استخدم `docs/openapi.json`

---

## ملخص سريع

| البند | التفاصيل |
|--------|-----------|
| الدور | `SERVICE_PROVIDER` — منفصل عن `OWNER` (عقارات) |
| قناة MVP | **لوحة ويب responsive** — بدون أبليكيشن منفصل |
| الطعام | `ServiceOrder` — أوردر كامل على المنصة |
| النقل | `ServiceLead` — lead ثم تواصل |
| الإعلان المجاني | `ServiceListing` — ظهور في البحث |
| الإعلان المدفوع (مرحلة 2) | `ProviderPromotion` + Paymob (stub) |
| العمولة | `commissionRate` على `ServiceCategory` — تبدأ **0%** |

---

## Tech Stack (اتبع مشروع الداشبورد الحالي)

- Vite + React + React Router v7
- TanStack React Query v5
- Axios عبر `useAxiosInstance`
- Tailwind + shadcn/ui
- i18next — **عربي + RTL**
- Auth: `access_token` cookie + `permissions` في localStorage
- Guards: `ProtectedRoute` + `PermissionGuard` / `hasPermission()`

```env
VITE_API_URL=http://localhost:3000
```

### Headers

```
Authorization: Bearer <accessToken>
Content-Type: application/json          # JSON endpoints
Content-Type: multipart/form-data       # KYC submit فقط
```

---

## التسجيل والدخول

### Register

```http
POST /auth/register
```

```json
{
  "name": "مطعم البحر",
  "email": "provider@example.com",
  "phone": "+201234567890",
  "password": "password123",
  "role": "SERVICE_PROVIDER"
}
```

> بعد التسجيل: تفعيل البريد (`POST /auth/verify-email`) ثم إنشاء الملف عبر `POST /provider/profile`.

### Post-login redirect (أضف للـ router)

```ts
if (!user.isVerified) → /auth/verify-email

if (role === 'SERVICE_PROVIDER') {
  // GET /provider/profile — إن 404 أو لا يوجد ملف
  if (!hasProfile) → /provider/setup

  if (status === 'DRAFT' || status === 'REJECTED') → /provider/profile
  if (status === 'PENDING') → /provider/pending-review
  if (status === 'SUSPENDED') → /provider/suspended
  if (status === 'APPROVED') → /provider/dashboard
}
```

> **ملاحظة:** `/auth/me` حالياً لا يرجع `providerStatus` — استدعِ `GET /provider/profile` بعد الدخول لتحديد المسار.

---

## Enums

### ServiceProviderStatus

| القيمة | المعنى |
|--------|--------|
| `DRAFT` | ملف غير مكتمل أو مرفوض — يمكن التعديل |
| `PENDING` | بانتظار موافقة الأدمن |
| `APPROVED` | نشط — يستقبل طلبات |
| `SUSPENDED` | موقوف |

### ServiceListingStatus

`DRAFT` | `ACTIVE` | `PAUSED`

> نشر الإعلان (`ACTIVE`) يتطلب `APPROVED`.

### ServiceOrderStatus

```
PENDING → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED
PENDING → REJECTED | CANCELLED
```

### ServiceLeadStatus

```
NEW → CONTACTED → QUOTED → COMPLETED
أي مرحلة → LOST
```

### ProviderPromotionType (مرحلة 2)

`HERO` | `FEATURED`

---

## Permissions

### SERVICE_PROVIDER

```
provider.profile.read
provider.profile.update
provider.coverage.manage
provider.listing.manage
provider.order.read
provider.order.manage
provider.lead.read
provider.lead.manage
provider.dashboard.read
provider.promotion.manage
service.read
```

### CUSTOMER (لتطبيق المصيف — مرجع)

```
service.read
service.order.create
service.order.read
service.lead.create
service.lead.read
```

### ADMIN

```
provider.review
service.category.read
service.category.manage
```

---

## الصفحات المطلوبة في الداشبورد

### Provider Portal (MVP)

| Route | Permission | الوصف |
|-------|------------|--------|
| `/provider/setup` | `provider.profile.update` | إنشاء ملف أول مرة |
| `/provider/profile` | `provider.profile.read` | عرض/تعديل + رفع KYC |
| `/provider/pending-review` | — | حالة PENDING |
| `/provider/suspended` | — | حالة SUSPENDED |
| `/provider/dashboard` | `provider.dashboard.read` | إحصائيات وأرباح |
| `/provider/coverage` | `provider.coverage.manage` | مناطق التغطية |
| `/provider/listings` | `provider.listing.manage` | إعلانات/منيو مجاني |
| `/provider/orders` | `provider.order.read` | قائمة أوردرات + قبول/رفض |
| `/provider/leads` | `provider.lead.read` | leads النقل |
| `/provider/promotions` | `provider.promotion.manage` | (مرحلة 2) إعلان مدفوع |

### Admin (قسم الأدمن في نفس الداشبورد)

| Route | Permission | الوصف |
|-------|------------|--------|
| `/admin/providers/pending` | `provider.review` | موافقة مقدمين |
| `/admin/service-categories` | `service.category.read` | فئات + commissionRate |

---

## API Reference

### عام (Public — بدون token)

#### GET `/services/categories`

فئات الخدمات النشطة (للتسجيل واختيار التصنيف).

**Response:**

```json
{
  "items": [
    { "id": "uuid", "name": "مطاعم", "slug": "restaurants", "description": "...", "sortOrder": 1 }
  ]
}
```

**Seed categories:** `restaurants` | `cafes` | `home-cooking` | `transport`

#### GET `/services/providers?city=&area=&category=&page=&limit=`

اكتشاف المقدمين المعتمدين (لتطبيق المصيف).

#### GET `/services/providers/:id`

تفاصيل مقدم + listings نشطة + menuItems.

---

### Provider Profile

#### GET `/provider/profile`

Permission: `provider.profile.read`

**Response (مختصر):**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "businessName": "مطعم البحر",
  "categoryId": "uuid",
  "description": "...",
  "logo": "https://.../uploads/...",
  "phone": "+201...",
  "whatsapp": "+201...",
  "nationalId": "https://...",
  "commercialRegister": null,
  "status": "APPROVED",
  "rejectionReason": null,
  "suspensionReason": null,
  "category": { "id": "...", "name": "مطاعم", "slug": "restaurants", "commissionRate": 0 },
  "coverageAreas": [{ "id": "...", "city": "الإسكندرية", "area": "سيدي بشر", "isActive": true }],
  "counts": { "listings": 2, "orders": 15, "leads": 3 }
}
```

#### POST `/provider/profile`

Permission: `provider.profile.update` — **مرة واحدة**

```json
{
  "businessName": "مطعم البحر",
  "categoryId": "<uuid from /services/categories>",
  "description": "توصيل طعام",
  "phone": "+201234567890",
  "whatsapp": "+201234567890"
}
```

#### PATCH `/provider/profile`

Permission: `provider.profile.update`

```json
{
  "businessName": "...",
  "categoryId": "...",
  "description": "...",
  "phone": "...",
  "whatsapp": "..."
}
```

#### POST `/provider/profile/submit`

Permission: `provider.profile.update`  
**Content-Type:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `logo` | file | optional |
| `nationalId` | file | one of nationalId / commercialRegister |
| `commercialRegister` | file | one of nationalId / commercialRegister |

→ يغيّر `status` إلى `PENDING` ويرسل إشعار للأدمن.

---

### Coverage Areas

#### GET `/provider/coverage-areas`

#### POST `/provider/coverage-areas`

```json
{ "city": "الإسكندرية", "area": "سيدي بشر" }
```

> `area` فارغ = تغطية المدينة كلها.

#### PATCH `/provider/coverage-areas/:id`

```json
{ "isActive": false }
```

#### DELETE `/provider/coverage-areas/:id`

---

### Listings (إعلان مجاني)

#### GET `/provider/listings`

#### POST `/provider/listings`

```json
{
  "title": "منيو المطعم",
  "description": "...",
  "menuItems": [{ "name": "كشري", "price": 25 }],
  "metadata": { "deliveryTime": "30-45 min" }
}
```

→ يُنشأ بحالة `DRAFT`.

#### PATCH `/provider/listings/:id`

```json
{
  "title": "...",
  "description": "...",
  "menuItems": [...],
  "metadata": {...},
  "status": "ACTIVE"
}
```

> `status: ACTIVE` يتطلب provider `APPROVED`.

#### DELETE `/provider/listings/:id`

---

### Orders — Provider

#### GET `/provider/orders?status=&from=&to=&page=&limit=`

Permission: `provider.order.read`

**Response:** paginated — كل order يتضمن `items`, `customer`, `listing`, `subtotal`, `deliveryFee`, `platformFee`, `providerNet`.

#### PATCH `/provider/orders/:id/accept`

Permission: `provider.order.manage`  
`PENDING` → `ACCEPTED` | يرسل FCM للعميل.

#### PATCH `/provider/orders/:id/reject`

```json
{ "reason": "غير متوفر حالياً" }
```

#### PATCH `/provider/orders/:id/status`

```json
{ "status": "PREPARING" }
```

**Allowed transitions:**

| From | To |
|------|-----|
| PENDING | ACCEPTED, REJECTED, CANCELLED |
| ACCEPTED | PREPARING, CANCELLED |
| PREPARING | OUT_FOR_DELIVERY, CANCELLED |
| OUT_FOR_DELIVERY | DELIVERED, CANCELLED |

---

### Leads — Provider

#### GET `/provider/leads?status=&from=&to=&page=&limit=`

#### PATCH `/provider/leads/:id/status`

```json
{ "status": "CONTACTED" }
```

**Flow:** `NEW` → `CONTACTED` → `QUOTED` → `COMPLETED` | `LOST`

---

### Dashboard

#### GET `/provider/dashboard/summary?from=&to=`

Permission: `provider.dashboard.read`

**Response:**

```json
{
  "period": { "from": "2026-06-01", "to": "2026-06-30" },
  "orders": {
    "total": 42,
    "delivered": 38,
    "acceptanceRate": 0.9
  },
  "leads": {
    "total": 10,
    "byStatus": [{ "status": "NEW", "count": 3 }]
  },
  "revenue": {
    "totalSales": 12500,
    "platformFee": 0,
    "providerNet": 12500
  },
  "topDeliveryAreas": [{ "area": "سيدي بشر", "orderCount": 12 }]
}
```

#### GET `/provider/dashboard/analytics?from=&to=&groupBy=daily|weekly`

**Response:**

```json
{
  "groupBy": "daily",
  "period": { "from": null, "to": null },
  "series": [
    { "period": "2026-06-18", "orders": 5, "sales": 800, "platformFee": 0, "providerNet": 800 }
  ]
}
```

> `series` مبني على orders بحالة `DELIVERED` فقط.

---

### Customer APIs (مرجع — تطبيق المصيف)

#### POST `/services/orders`

Permission: `service.order.create`

```json
{
  "listingId": "uuid",
  "items": [{ "name": "كشري", "quantity": 2, "unitPrice": 25 }],
  "deliveryCity": "الإسكندرية",
  "deliveryArea": "سيدي بشر",
  "deliveryAddress": "شارع 12",
  "deliveryFee": 15,
  "notes": "بدون بصل"
}
```

→ FCM لمقدم الخدمة (`SERVICE_ORDER_RECEIVED`).

#### GET `/services/my/orders?page=&limit=`

#### POST `/services/leads`

```json
{
  "providerId": "uuid",
  "type": "microbus",
  "pickupCity": "الإسكندرية",
  "pickupArea": "سيدي بشر",
  "destination": "مارينا",
  "passengers": 4,
  "preferredDateTime": "2026-06-20T10:00:00.000Z",
  "notes": "..."
}
```

#### GET `/services/my/leads`

---

### Admin

#### GET `/admin/providers/pending?page=&limit=`

#### PATCH `/admin/providers/:userId/approve`

#### PATCH `/admin/providers/:userId/reject`

```json
{ "reason": "مستندات غير واضحة" }
```

#### PATCH `/admin/providers/:userId/suspend`

```json
{ "reason": "شكاوى متكررة" }
```

#### GET `/admin/service-categories`

#### POST `/admin/service-categories`

```json
{
  "name": "مطاعم",
  "slug": "restaurants",
  "description": "...",
  "commissionRate": 0.12
}
```

#### PATCH `/admin/service-categories/:id`

```json
{
  "name": "...",
  "commissionRate": 0.1,
  "isActive": true,
  "sortOrder": 1
}
```

> `commissionRate`: decimal — `0.12` = 12%

---

### Promotions (مرحلة 2)

#### GET `/provider/promotions`

#### POST `/provider/promotions`

```json
{
  "type": "HERO",
  "price": 500,
  "listingId": "uuid-optional",
  "startsAt": "2026-07-01",
  "endsAt": "2026-07-31"
}
```

**Response includes:**

```json
{
  "payment": {
    "checkoutUrl": null,
    "paymobOrderId": null,
    "message": "Paymob integration pending..."
  }
}
```

#### POST `/provider/promotions/:id/confirm-payment`

```json
{ "paymobOrderId": "manual-or-paymob-ref" }
```

> عند تفعيل Paymob: عيّن `PAYMOB_API_KEY` و `PAYMOB_INTEGRATION_ID` في backend `.env`.

---

## FCM / Notifications

بعد تسجيل الدخول، سجّل device token (نفس flow الموجود):

```http
POST /notifications/device-token
{ "token": "...", "platform": "web" }
```

### أنواع إشعار جديدة (Provider Portal)

| Type | المستلم | متى |
|------|---------|-----|
| `SERVICE_ORDER_RECEIVED` | Provider | أوردر جديد |
| `SERVICE_ORDER_ACCEPTED` | Customer | قبول |
| `SERVICE_ORDER_REJECTED` | Customer | رفض |
| `SERVICE_ORDER_STATUS_UPDATED` | Customer | تحديث حالة |
| `SERVICE_LEAD_RECEIVED` | Provider | lead نقل |
| `SERVICE_LEAD_STATUS_UPDATED` | Customer | تحديث lead |
| `SERVICE_PROVIDER_APPROVED` | Provider | موافقة أدمن |
| `SERVICE_PROVIDER_REJECTED` | Provider | رفض |
| `SERVICE_PROVIDER_SUSPENDED` | Provider | تعليق |
| `PROVIDER_PROMOTION_ACTIVATED` | Provider | تفعيل إعلان مدفوع |

**Provider orders page:** استمع لـ `SERVICE_ORDER_RECEIVED` → refresh قائمة الأوردرات أو badge.

---

## React Query hooks (اقترح إنشاءها)

```
src/features/service-provider/
  useServiceCategories.ts       → GET /services/categories
  useProviderProfile.ts         → GET /provider/profile
  useCreateProviderProfile.ts   → POST /provider/profile
  useUpdateProviderProfile.ts   → PATCH /provider/profile
  useSubmitProviderProfile.ts   → POST /provider/profile/submit (multipart)
  useCoverageAreas.ts           → CRUD /provider/coverage-areas
  useListings.ts                → CRUD /provider/listings
  useProviderOrders.ts          → GET /provider/orders
  useAcceptOrder.ts             → PATCH .../accept
  useRejectOrder.ts             → PATCH .../reject
  useUpdateOrderStatus.ts       → PATCH .../status
  useProviderLeads.ts           → GET /provider/leads
  useUpdateLeadStatus.ts        → PATCH .../status
  useDashboardSummary.ts        → GET /provider/dashboard/summary
  useDashboardAnalytics.ts      → GET /provider/dashboard/analytics
  usePromotions.ts              → (phase 2)

src/features/admin/service-provider/
  usePendingProviders.ts
  useApproveProvider.ts
  useRejectProvider.ts
  useSuspendProvider.ts
  useServiceCategoriesAdmin.ts
```

---

## UI Components (اقتراحات)

### Provider Layout

Sidebar RTL:

- الرئيسية (dashboard)
- الملف والتحقق
- مناطق التغطية
- الإعلانات / المنيو
- الأوردرات (badge للـ PENDING)
- طلبات النقل
- الإعلانات المميزة (phase 2)

### Orders Table

أعمدة: `#` | العميل | القائمة | المبلغ | `providerNet` | الحالة | الإجراءات

أزرار حسب الحالة:

- `PENDING` → قبول / رفض
- `ACCEPTED` → «قيد التحضير»
- `PREPARING` → «خرج للتوصيل»
- `OUT_FOR_DELIVERY` → «تم التسليم»

### Dashboard Cards

- إجمالي الأوردرات
- المسلّمة
- معدل القبول %
- إجمالي المبيعات
- عمولة المنصة
- **صافي الربح** (`providerNet`)

---

## Business Rules

1. **لا تخلط** `OWNER` مع `SERVICE_PROVIDER` — verticals منفصلة.
2. Provider يجب أن يغطي `deliveryCity`/`pickupCity` في coverage areas قبل استقبال طلبات.
3. `platformFee` = `(subtotal + deliveryFee) × commissionRate` — تُحسب عند إنشاء الأوردر.
4. الإعلان المجاني (`ServiceListing` ACTIVE) ≠ الإعلان المدفوع (`ProviderPromotion`).
5. KYC submit = **multipart** — لا ترسل الصور كـ base64 في JSON.
6. استخدم `permissions` من API — لا hardcode قائمة الصلاحيات.

---

## Cursor Prompt (انسخ للداشبورد)

```
Implement the Service Provider Portal in this dashboard project using docs/SERVICE_PROVIDER_README.md from the aqar backend repo.

Requirements:
- Arabic RTL UI, reuse existing auth/axios/guards patterns
- Routes under /provider/* as documented
- Post-login redirect based on GET /provider/profile status
- Provider dashboard with summary cards + orders/leads management
- Admin pages: /admin/providers/pending + /admin/service-categories
- FCM: refresh orders on SERVICE_ORDER_RECEIVED
- Read openapi.json or Swagger for exact shapes — do not guess

API base: VITE_API_URL (default http://localhost:3000)
```

---

## Backend Files (مرجع)

| Path | Purpose |
|------|---------|
| `src/service-provider/` | Module كامل |
| `prisma/schema.prisma` | Models + enums |
| `prisma/service-category.seed-data.ts` | Seed categories |
| `prisma/migrations/20250618120000_add_service_providers/` | Migration |

---

*Last updated: June 2026 — Service Provider MVP + Phase 2 promotion stub*
