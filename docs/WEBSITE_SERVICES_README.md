# خدمات المصيف على الموقع — دليل الفرونت إند

> **الغرض:** بناء صفحات الموقع العام (للعميل) لعرض مقدمي الخدمات و**منيو كل بروفايدر** والطلب.  
> **Backend:** NestJS — `e:\aqar`  
> **Swagger:** `http://localhost:3000/api/docs`

---

## الصفحات المطلوبة

| Route | الوصف |
|-------|--------|
| `/services` | فئات الخدمات + بحث مقدمين (مدينة/منطقة/فئة) |
| `/services/providers/:providerId` | صفحة المقدم: بيانات + **المنيو** + إعلانات + زر طلب |
| `/services/orders` (أو modal) | سلة الطلب + عنوان التوصيل |
| `/account/orders` | طلباتي (يتطلب تسجيل دخول) |

---

## APIs عامة (بدون token)

### قائمة المقدمين

```http
GET /services/providers?city=الإسكندرية&area=سيدي بشر&category=restaurants&page=1&limit=20
```

**Response (كل عنصر):**

```json
{
  "id": "provider-profile-uuid",
  "businessName": "مطعم البحر",
  "description": "...",
  "logo": "https://...",
  "phone": "+201...",
  "whatsapp": "+201...",
  "category": { "id": "...", "name": "مطاعم", "slug": "restaurants" },
  "featuredListing": { "id": "...", "title": "عرض الصيف" },
  "menuItemsCount": 12,
  "hasMenu": true,
  "isPromoted": false,
  "promotionTypes": []
}
```

استخدم `hasMenu` / `menuItemsCount` على الكارت: «١٢ صنف» أو أخفِ زر الطلب إن لم يكن هناك منيو.

**`category`:** `restaurants` | `cafes` | `home-cooking` | `transport`

---

### تفاصيل المقدم + المنيو (الطريقة الموصى بها)

```http
GET /services/providers/:providerId
```

**Response:**

```json
{
  "id": "provider-profile-uuid",
  "businessName": "مطعم البحر",
  "description": "مأكولات بحرية...",
  "logo": "https://...",
  "phone": "+201...",
  "whatsapp": "+201...",
  "category": { "id": "...", "name": "مطاعم", "slug": "restaurants" },
  "coverageAreas": [{ "city": "الإسكندرية", "area": "سيدي بشر", "isActive": true }],
  "menuItems": [
    {
      "id": "menu-item-uuid",
      "name": "سمك مشوي",
      "price": 120,
      "prepTimeMinutes": 25,
      "sortOrder": 0
    }
  ],
  "listings": [
    {
      "id": "listing-uuid",
      "title": "عرض الصيف — توصيل مجاني",
      "description": "...",
      "metadata": null
    }
  ]
}
```

- **`menuItems`** = منيو البروفايل الثابت (للطلب).
- **`listings`** = إعلانات/عروض فقط — **لا تحتوي منيو**.

---

### المنيو فقط (اختياري)

```http
GET /services/providers/:providerId/menu
```

```json
{
  "items": [
    { "id": "...", "name": "سمك مشوي", "price": 120, "prepTimeMinutes": 25, "isActive": true, "sortOrder": 0 }
  ]
}
```

استخدمه إذا أردت تحديث المنيو بدون إعادة جلب كل تفاصيل المقدم.

---

## عرض المنيو في الواجهة

### متى تظهر قائمة المنيو؟

| فئة المقدم | عرض المنيو |
|------------|-------------|
| `restaurants`, `cafes`, `home-cooking` | نعم — جدول/كروت أصناف |
| `transport` | لا — اعرض `listings[].metadata` + نموذج lead |

```tsx
// مثال منطق العرض
const showMenu =
  provider.category.slug !== 'transport' && provider.menuItems.length > 0;
```

### أعمدة الجدول (RTL)

| العمود | الحقل |
|--------|--------|
| الصنف | `name` |
| السعر | `price` + «ج.م» |
| وقت التجهيز | `prepTimeMinutes` + «دقيقة» |
| الكمية | input محلي في السلة |
| إضافة | زر يضيف للسلة بـ `menuItemId` |

### سلة الطلب (state محلي)

```ts
type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  prepTimeMinutes: number;
  quantity: number;
  notes?: string;
};
```

احسب الإجمالي: `sum(item.price * item.quantity)`.

---

## إرسال الطلب (يتطلب تسجيل دخول)

Permission: `service.order.create` (دور `CUSTOMER`)

```http
POST /services/orders
Authorization: Bearer <accessToken>
```

```json
{
  "providerId": "provider-profile-uuid",
  "listingId": "listing-uuid",
  "items": [
    { "menuItemId": "menu-item-uuid", "quantity": 2, "notes": "بدون بصل" }
  ],
  "deliveryCity": "الإسكندرية",
  "deliveryArea": "سيدي بشر",
  "deliveryAddress": "شارع 10",
  "deliveryFee": 20,
  "notes": "اتصل قبل الوصول"
}
```

- `providerId` من صفحة المقدم (`GET /services/providers/:id`).
- `items[].menuItemId` من `menuItems[].id` — **لا ترسل السعر يدوياً**.
- `listingId` اختياري — مرّره إن جاء العميل من إعلان معيّن (`?listingId=` في URL).

### طلباتي

```http
GET /services/my/orders?page=1&limit=20
Authorization: Bearer <accessToken>
```

---

## React Query hooks (اقتراح)

```
src/features/services/
  useServiceCategories.ts     → GET /services/categories
  useServiceProviders.ts      → GET /services/providers (filters)
  useServiceProvider.ts       → GET /services/providers/:id  ← المنيو هنا
  useProviderMenu.ts          → GET /services/providers/:id/menu (اختياري)
  useCreateServiceOrder.ts    → POST /services/orders
  useMyServiceOrders.ts       → GET /services/my/orders
```

**مفتاح الكاش:**

```ts
['services', 'provider', providerId]
```

---

## تدفق الصفحة (مخطط)

```
/services
    ↓ اختيار مقدم
/services/providers/:providerId
    ↓ GET /services/providers/:id
    ├─ هيدر: logo, businessName, phone, whatsapp
    ├─ منيو: menuItems[]  ← العرض الرئيسي
    ├─ إعلانات: listings[] (بanners)
    └─ سلة → POST /services/orders
```

---

## بيانات تجريبية (demo)

بعد `RESET_DB=true npx ts-node prisma/reset.ts`:

| المقدم | البريد | كلمة المرور |
|--------|--------|-------------|
| مطعم البحر | `provider1@demo.aqar.com` | `Demo@12345678` |
| عميل للطلب | `customer1@demo.aqar.com` | `Demo@12345678` |

جرب:

```http
GET /services/providers?city=الإسكندرية&category=restaurants
```

ثم افتح `id` المقدم في:

```http
GET /services/providers/{id}
```

ستجد `menuItems` جاهزة للعرض.

---

## Cursor Prompt (انسخ لمشروع الموقع)

```
Build public service provider pages for the Aqar website using docs/WEBSITE_SERVICES_README.md from the backend repo.

Requirements:
- Arabic RTL, Tailwind + shadcn, React Query + existing axios hook
- /services — list providers with filters (city, area, category from GET /services/categories)
- /services/providers/:providerId — provider detail page
- Display profile menu from menuItems[] (name, price, prepTimeMinutes) — NOT from listings
- Hide menu section for transport category; show lead form instead (POST /services/leads)
- Cart + checkout: POST /services/orders with menuItemId + quantity (login required)
- Optional listingId query param for ad attribution
- Use VITE_API_URL; read openapi.json for exact types
```

---

*آخر تحديث: يونيو ٢٠٢٦*
