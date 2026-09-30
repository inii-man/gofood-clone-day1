# 🍕 GoFood Clone — Fullstack Mobile (Day 1, Day 2 & Day 3)

Hands-on project pembelajaran Fullstack Mobile Development (**GoFood Clone**). Terdiri dari backend REST API & WebSocket menggunakan **Node.js, Express, Prisma ORM, PostgreSQL, Socket.io, dan Jest**, serta aplikasi mobile cross-platform menggunakan **React Native (Expo SDK 57), TypeScript, Context API, Redux Toolkit, Expo Notifications, dan OpenStreetMap**.

---

## 📱 Cakupan Fitur Aplikasi

### **Day 1: Store & Food Catalog**
- 🏬 **Katalog Restoran & Menu**: Menampilkan banner promo, kategori makanan, rating, estimasi waktu, dan daftar menu makanan.
- 🛒 **Cart Management**: Context API (`CartContext`) untuk menambah, menghapus, menghitung total belanja, dan mengosongkan keranjang.
- 🗄️ **Database & Seeder**: PostgreSQL + Prisma ORM dengan data awal restoran & makanan.

### **Day 2: From Cart to Live Order & Tracking**
- 🔐 **Autentikasi & Otorisasi**: Registrasi, Login, Password Hashing (`bcryptjs`), Token JWT (`jsonwebtoken`), dan sesi login persisten via `AsyncStorage`.
- ⚙️ **Advanced State Management**: Redux Toolkit (`orderSlice`) untuk mengelola lifecycle checkout pesanan (`idle` ➔ `loading` ➔ `success` / `failed`).
- 📦 **Order Management**: Pembuatan pesanan (`POST /api/orders`) terproteksi JWT, kalkulasi total harga otomatis di backend, dan riwayat pesanan (`GET /api/orders`).
- 🛵 **Real-time Driver Tracking**: Pelacakan posisi kurir secara instan menggunakan **Socket.io Rooms** (`order:{orderId}`).
- 🗺️ **Peta Interaktif Live (OpenStreetMap + Leaflet)**: Visualisasi peta nyata tanpa perlu Google Maps API Key.
- 🎮 **In-Screen Driver Simulator**: Simulasi pergerakan motor kurir nyata menyusuri 12 titik jalan raya Jakarta (*Sudirman ➔ Semanggi ➔ Senayan*).

### **Day 3: Production Readiness — Notifications, Payments, Testing & Performance**
- 🔔 **Push Notifications & Device Token**:
  - Model Prisma `DeviceToken` untuk menyimpan token perangkat per user (support multi-device).
  - Endpoint `POST /api/devices` dengan upsert token perangkat.
  - Integrasi `expo-notifications` di mobile dengan handler notifikasi foreground & sync token otomatis saat login.
  - Event-based notification engine (`ORDER_CREATED`, `PAYMENT_SUCCESS`, `ORDER_CONFIRMED`, `DRIVER_ASSIGNED`, `ORDER_COMPLETED`).
- 💳 **Payment Module & Interactive Simulator**:
  - Model Prisma `Payment` dengan relasi 1-to-1 ke `Order` (`orderId`, `amount`, `status: PENDING | PAID | FAILED`, `method`).
  - Endpoint `POST /api/payments` untuk membuat transaksi pembayaran saat checkout.
  - Endpoint `POST /api/payments/simulate` untuk mensimulasikan hasil pembayaran (`PAID` atau `FAILED`) tanpa perlu payment gateway sungguhan.
  - Transisi status otomatis: Pembayaran `PAID` ➔ Order menjadi `CONFIRMED` & Push Notification otomatis dikirimkan ke perangkat user.
  - Modal simulator interaktif di aplikasi mobile dengan pilihan metode: QRIS, GoPay, Virtual Account, & Tunai.
- 🧪 **Automated Unit Testing**:
  - Setup Jest + `ts-jest` di backend dengan script `npm test`.
  - Unit test `calculateTotal.test.ts` untuk menguji kalkulasi subtotal harga pesanan & pengujian skenario negatif (keranjang kosong).
- ⚡ **Performance & Database Query Optimization**:
  - Query database teroptimasi dengan paginasi (`page`, `limit`, `skip`, `take`) pada order API.
  - Penggunaan `FlatList` pada aplikasi mobile untuk merender riwayat pesanan dalam jumlah besar secara efisien tanpa lag.

---

## 🗂️ Struktur Proyek

```text
gofood-clone-day1/
├── backend/                  # REST API, WebSocket & Notification Engine
│   ├── prisma/
│   │   ├── schema.prisma     # Skema DB: User, Restaurant, MenuItem, Order, OrderItem, DeviceToken, Payment
│   │   └── seed.ts           # Seeder restoran, menu & user demo
│   ├── src/
│   │   ├── controllers/      # authController, orderController, restaurantController, deviceController, paymentController
│   │   ├── middleware/       # authMiddleware (JWT Verification & Role check)
│   │   ├── prisma/           # client.ts (Prisma Singleton)
│   │   ├── routes/           # authRoutes, orderRoutes, restaurantRoutes, deviceRoutes, paymentRoutes
│   │   ├── services/         # notificationService.ts (Expo Push sender & notification events)
│   │   ├── utils/            # calculateTotal.ts & calculateTotal.test.ts
│   │   └── server.ts         # Inisialisasi Express, Middleware logger, Socket.io, & Health check
│   ├── jest.config.js        # Konfigurasi Jest + ts-jest
│   ├── .env.example
│   └── package.json
├── mobile/                   # Aplikasi Mobile React Native (Expo SDK 57)
│   ├── src/
│   │   ├── components/       # SearchBar, CategoryItem, RestaurantCard, TrackingMap
│   │   ├── context/          # AuthContext (AsyncStorage & auto-sync), CartContext
│   │   ├── navigation/       # AppNavigator (Native Stack & Auth Guard)
│   │   ├── screens/          # Login, Register, Home, RestaurantDetail, Checkout, OrderHistory, OrderTracking, DriverSimulator
│   │   ├── services/         # api.ts, orderApi.ts, socket.ts, notification.ts, deviceApi.ts, paymentApi.ts
│   │   └── store/            # Redux Toolkit (orderSlice, store.ts)
│   ├── .env.example
│   ├── App.tsx               # Root Provider + Push Notification Sync Wrapper
│   └── package.json
├── docs/                     # 📚 Dokumentasi lengkap arsitektur, kode, alur, & testing
│   ├── 01_ARSITEKTUR_DAN_OVERVIEW.md
│   ├── 02_ALUR_FLOW_APLIKASI.md
│   ├── 03_BEDAH_KODE_BACKEND.md
│   ├── 04_BEDAH_KODE_MOBILE.md
│   └── 05_PANDUAN_SETUP_DAN_TESTING.md
├── jwt-playground/           # 🔑 Playground visual interaktif untuk belajar JWT
└── README.md
```

---

## 🚀 1. Persiapan & Menjalankan Backend

1. **Masuk ke folder backend & pasang dependensi:**
   ```bash
   cd backend
   npm install
   ```

2. **Atur Environment Variable (`.env`):**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/gofood_db?schema=public"
   JWT_SECRET="gofood-rahasia-super-aman"
   PORT=3000
   ```

3. **Inisialisasi Skema Database & Jalankan Seeder:**
   ```bash
   npx prisma db push
   npx prisma generate
   npm run seed
   ```

4. **Jalankan Unit Test:**
   ```bash
   npm test
   ```
   *Output akan memverifikasi kalkulasi total item dan skenario negatif.*

5. **Jalankan Server:**
   ```bash
   npm run dev
   ```
   *Server berjalan di `http://0.0.0.0:3000` (terbuka untuk koneksi lokal/LAN).*

---

## 📱 2. Persiapan & Menjalankan Mobile App (Expo)

1. **Cek Alamat IP Lokal Komputer/Mac:**
   ```bash
   ipconfig getifaddr en0
   ```
   *(Misal IP yang tampil: `192.168.88.7`)*

2. **Masuk ke folder mobile & atur `.env`:**
   ```bash
   cd mobile
   npm install
   ```
   Pastikan file `mobile/.env` mengarah ke IP komputer Anda:
   ```env
   EXPO_PUBLIC_API_URL=http://<IP_KOMPUTER_ANDA>:3000/api
   ```
   *Contoh:* `EXPO_PUBLIC_API_URL=http://192.168.88.7:3000/api`



3. **Jalankan Expo:**
   ```bash
   npx expo start -c
   ```
   - Tekan **`i`** untuk iOS Simulator atau **`a`** untuk Android Emulator.
   - Atau scan QR code dari aplikasi **Expo Go** di smartphone fisik Anda (pastikan berada di satu jaringan Wi-Fi yang sama).

---

## 🧪 3. Pengujian API via cURL (Day 3 Endpoints)

### A. Simpan Device Token untuk Push Notification
```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "platform": "mobile"
  }'
```

### B. Buat Transaksi Pembayaran
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "<ORDER_ID>",
    "method": "QRIS"
  }'
```

### C. Jalankan Simulator Pembayaran (PAID)
```bash
curl -X POST http://localhost:3000/api/payments/simulate \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "<PAYMENT_ID>",
    "status": "PAID"
  }'
```
*Hasil: Status payment menjadi `PAID`, status pesanan berubah menjadi `CONFIRMED`, dan push notification otomatis dikirim ke token perangkat.*

---

## 🛠️ Troubleshooting & Panduan Solusi Error

### 🔴 1. Student Bisa Login, Tapi Saat Checkout Muncul Error `401 Unauthorized`
- **Penyebab**: Token JWT tidak terkirim di header HTTP saat memanggil API terproteksi.
- **Solusi**: Pastikan di `mobile/src/services/api.ts` sudah dipasang **Request Interceptor** yang mengambil token dari `AsyncStorage` dan menambahkan header `Authorization: Bearer <token>`.

### 🔴 2. Push Notification Tidak Muncul di Simulator
- **Penyebab**: iOS Simulator & beberapa Android emulator tidak mendukung push notifications jarak jauh (remote push) secara default.
- **Solusi**: 
  - Gunakan perangkat smartphone fisik dengan **Expo Go** untuk menguji penerimaan push notification nyata.
  - Di console backend, log pengiriman notifikasi tetap tercatat lengkap dengan status pengiriman ke endpoint Expo Push API.

### 🔴 3. Error `API TIMEOUT 10000MS` / Gagal Terhubung ke Server
- **Penyebab**: Alamat IP laptop/komputer Anda berubah (misalnya setelah berganti koneksi Wi-Fi).
- **Solusi**:
  1. Cek kembali IP aktif Anda: `ipconfig getifaddr en0`.
  2. Buka `mobile/.env` dan perbarui `EXPO_PUBLIC_API_URL` dengan IP baru.
  3. Restart Expo dengan flag cache bersih: `npx expo start -c`.

### 🔴 4. Error `listen EADDRINUSE: address already in use 0.0.0.0:3000`
- **Penyebab**: Proses node backend sebelumnya masih berjalan di background.
- **Solusi**:
  ```bash
  lsof -ti :3000 | xargs kill -9
  npm run dev
  ```

---

## 📚 Folder Dokumentasi & Playground Khusus

1. **Dokumentasi Lengkap Proyek**:
   Pelajari detail arsitektur, flow bisnis, dan bedah kode line-by-line di folder [**`docs/`**](./docs/README.md).
2. **Interactive JWT Playground**:
   Buka playground visual untuk memahami anatomi token, tampering detector, dan simulasi login di folder [**`jwt-playground/`**](./jwt-playground/README.md):
   ```bash
   open jwt-playground/index.html
   ```
