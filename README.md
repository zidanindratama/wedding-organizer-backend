# JeWePe Wedding Organizer — Backend API

Backend **Express + TypeScript** untuk platform JeWePe Wedding Organizer.
Fitur: autentikasi JWT, katalog paket, pemesanan (orders), kontak, laporan.
Pakai **Prisma ORM** (MongoDB Atlas), validasi dengan **Zod**, serta middleware (Helmet, CORS, Morgan).

---

## ✨ Fitur Utama

- **Auth**: login pakai email & password → JWT.
- **Packages**: list paket publik (search, sort, paginate), CRUD admin.
- **Orders**: buat order publik, cek order, list & ubah status (admin).
- **Contacts**: kirim pesan publik, list + ubah status (admin).
- **Reports**: ringkasan order, tren, distribusi status, export CSV, top package, upcoming event.
- **Validasi**: pakai **Zod** → respon error lebih jelas.
- **Keamanan**: Helmet, CORS allowlist, JSON size limit.

---

## 🧱 Tech Stack

- **Express + TypeScript**
- **Prisma ORM** (MongoDB Atlas)
- **jsonwebtoken**, **bcryptjs**
- **zod**, **helmet**, **cors**, **morgan**

---

## 📁 Struktur Proyek

```
.
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ src/
│  ├─ app.ts
│  ├─ server.ts
│  ├─ config/env.ts
│  ├─ db/prisma.ts
│  ├─ middleware/
│  │  ├─ auth.ts
│  │  ├─ error.ts
│  │  └─ validate.ts
│  └─ modules/
│     ├─ auth/
│     ├─ contacts/
│     ├─ orders/
│     ├─ packages/
│     └─ reports/
```

---

## ⚙️ Konfigurasi Environment

Buat file `.env` di root:

```env
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=super_secret_ganti_ya
JWT_EXPIRES_IN=1d

# MongoDB Atlas
DATABASE_URL="mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net/jewepe"

# Seed admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=admin123
SEED_ADMIN_NAME=Admin
```

> **Note**: Ganti `<user>` dan `<password>` sesuai akun Atlas.
> Jangan lupa whitelist IP di Atlas biar backend bisa connect.

---

## 🚀 Setup & Jalankan

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma prisma:generate

# Push schema ke Atlas
npx prisma db:push

# (Opsional) Seed admin user
npm run seed

# Development mode
npm run dev

# Production build
npm run build
npm start
```

- Server jalan di: `http://localhost:3000`
- Health check: `GET /api/v1/health` → `{ "status": "ok" }`

---

## 🔐 Autentikasi

- **Login**: `POST /api/v1/auth/login`
- Token JWT dipakai di header:

  ```
  Authorization: Bearer <accessToken>
  ```

- Payload JWT: `userId`, `email`, `role` (`ADMIN` | `USER`).

---

## 🌐 CORS

Allowed origins:

- `http://localhost:3000`
- `https://wedding-organizer-frontend.vercel.app`
- semua preview Vercel: `https://*-wedding-organizer-frontend-*.vercel.app`

---

## 📦 API Reference

Base URL: `/api/v1`

---

### 1) Auth

#### `POST /auth/login`

Body:

```json
{ "email": "admin@example.com", "password": "admin123" }
```

Respon:

```json
{
  "status": "success",
  "data": {
    "accessToken": "JWT_HERE",
    "user": { "id": "...", "name": "Admin", "email": "...", "role": "ADMIN" }
  }
}
```

---

### 2) Packages

#### `GET /packages` (Publik)

Query:

- `search` (string)
- `sort` = `az|za|cheap|expensive`
- `page`, `limit` (1..100)

#### `GET /packages/:id` (Publik)

#### `GET /packages/admin/all` (ADMIN)

List semua paket, termasuk yang `isActive=false`.

#### `POST /packages` (ADMIN)

```json
{
  "name": "Silver Glam",
  "description": "Paket simple dan elegan",
  "price": 15000000,
  "isActive": true,
  "imageUrl": "https://example.com/silver.jpg"
}
```

#### `PUT /packages/:id` (ADMIN)

Partial update (semua field opsional).

#### `DELETE /packages/:id` (ADMIN)

---

### 3) Orders

#### `POST /orders` (Publik)

```json
{
  "packageId": "pkg_id",
  "customerName": "Calon Pengantin",
  "customerEmail": "cp@example.com",
  "customerPhone": "0812...",
  "eventDate": "2025-12-20T00:00:00.000Z",
  "venue": "Gedung Serbaguna",
  "notes": "Dekorasi hijau"
}
```

Respon: `201` dengan order baru (`status: PENDING`, `orderCode` random).

#### `GET /orders/check` (Publik)

Minimal pakai `code` atau `email`.
Query tambahan: `status, packageId, userId, dateFrom, dateTo, minPrice, maxPrice, q`
Sort: `newest|oldest|event_asc|event_desc|price_asc|price_desc|name_asc|name_desc`

- Pagination (`page`, `limit`).

#### `GET /orders` (ADMIN)

List semua order (include `package` & `user`).

#### `PATCH /orders/:id/status` (ADMIN)

```json
{ "status": "PENDING" | "APPROVED" | "REJECTED" }
```

---

### 4) Contacts

#### `POST /contacts` (Publik)

```json
{
  "name": "Calon Pengantin",
  "email": "cp@example.com",
  "message": "Halo, saya ingin tanya..."
}
```

#### `GET /contacts` (ADMIN)

Query: `q`, `status`, `sort`, `page`, `limit`

#### `PATCH /contacts/:id/status` (ADMIN)

```json
{ "status": "NEW" | "READ" }
```

---

### 5) Reports (ADMIN)

- `GET /reports/orders/summary` → `{ total, approved, pending, rejected }`
- `GET /reports/orders/status-distribution` → distribusi status
- `GET /reports/orders/trend?days=30` → `[ { date, count, revenue } ]`
- `GET /reports/orders/export/csv` → download CSV
- `GET /reports/revenue/summary` → bulan ini `{ revenueThisMonth, avgOrderValueThisMonth, ordersThisMonth }`
- `GET /reports/packages/top?limit=3` → paket terlaris
- `GET /reports/events/upcoming?days=30` → `{ upcomingCount, rangeDays }`
- `GET /reports/pending/aging` → `{ oldestPendingDays, orderCode }`

---

## 🔎 Contoh cURL

```bash
# Login
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# List paket publik
curl -s "http://localhost:3000/api/v1/packages?sort=cheap&limit=5"

# Buat order
curl -s -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{"packageId":"<pkgId>","customerName":"Salsa","customerEmail":"salsa@example.com"}'

# Cek order
curl -s "http://localhost:3000/api/v1/orders/check?email=salsa@example.com"

# Export orders CSV (Admin)
curl -L -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/reports/orders/export/csv -o orders.csv
```

---

## 🛡️ Error Handling

- **400** (validasi):

```json
{ "status":"fail", "message":"Validation error", "issues":{...} }
```

- **401 / 403**:

```json
{ "status":"fail","message":"Missing token" }
{ "status":"fail","message":"Invalid token" }
{ "status":"fail","message":"Admin only" }
```

- **404**:

```json
{ "status": "fail", "message": "Route not found" }
```

- **500**:

```json
{ "status": "error", "message": "Internal Server Error" }
```

---

## 🛡️ Catatan Keamanan

- Gunakan `JWT_SECRET` yang kuat.
- Jangan commit file `.env`.
- Pastikan whitelist IP Atlas sesuai server frontend/backend.
- Rate limiting disarankan untuk endpoint publik (`/orders`, `/contacts`).

---

## 📄 License

MIT © 2025 JeWePe Team

---

👉 Dengan Atlas, kamu tinggal pakai `DATABASE_URL` dari dashboard Atlas. Nggak perlu setup replica set manual.
