# 📖 Dokumentasi Kode: GoFood Clone (Day 1, Day 2 & Day 3)

Dokumen ini menjelaskan struktur kode, arsitektur, dan alur kerja aplikasi secara menyeluruh dari sisi Backend maupun Mobile hingga implementasi Day 3 (Production Readiness).

---

## 🏗️ Arsitektur Sistem Umum

Aplikasi ini menggunakan pola **Client-Server Terdistribusi**:
1. **Client (Mobile)**: Dibangun dengan **React Native (Expo SDK 57)**. Menggunakan Context API & Redux Toolkit untuk state management, Axios untuk komunikasi REST API, Socket.io-Client untuk pelacakan kurir, serta `expo-notifications` untuk menerima push notification.
2. **Server (Backend)**: Dibangun dengan **Node.js, Express, dan TypeScript**. Bertugas melayani REST API, verifikasi JWT Bearer, WebSocket Server (Socket.io) dengan Room khusus pesanan, integrasi push notification ke Expo Push service, dan unit test berbasis Jest.
3. **Database**: Menggunakan **PostgreSQL** dengan **Prisma ORM** sebagai penghubung type-safe.

Alur data secara umum:
**Mobile (Axios)** ➡️ **Backend (Express Route ➔ Middleware ➔ Controller)** ➡️ **Prisma ORM** ➡️ **PostgreSQL** ➡️ (kembali ke UI)

---

## 🗄️ Bagian 1: Backend (Node.js + Express + Prisma)
Berlokasi di folder `/backend`.

### 1. `prisma/schema.prisma`
Mendefinisikan skema data PostgreSQL:
- **`Restaurant`**: Data restoran (nama, gambar, rating, ongkir, kategori, promo).
- **`MenuItem`**: Makanan/minuman yang terhubung ke `Restaurant`.
- **`User`**: Data pengguna (email, nama, passwordHash, role: `CUSTOMER` / `DRIVER` / `ADMIN`), relasi ke `Order[]` dan `DeviceToken[]`.
- **`Order`**: Transaksi pesanan (`userId`, `status`, `totalPrice`), relasi ke `OrderItem[]` dan `Payment?`.
- **`OrderItem`**: Rincian makanan yang dibeli (`orderId`, `menuItemId`, `quantity`, `price`).
- **`DeviceToken`**: Token push notification perangkat unik (`userId`, `token`, `platform`).
- **`Payment`**: Transaksi pembayaran (`orderId`, `amount`, `status: PENDING | PAID | FAILED`, `method`, `transactionId`).

### 2. `src/server.ts`
Titik awal (*entry point*) backend:
- Menyiapkan server Express dan HTTP server untuk WebSocket Socket.io.
- Mengaktifkan CORS dan JSON body parser.
- Middleware logging request lengkap dengan durasi respon (ms) dan preview token authorization.
- Mendaftarkan endpoint router:
  - `/api/auth` ➔ `authRoutes.ts`
  - `/api/restaurants` ➔ `restaurantRoutes.ts`
  - `/api/orders` ➔ `orderRoutes.ts`
  - `/api/devices` ➔ `deviceRoutes.ts`
  - `/api/payments` ➔ `paymentRoutes.ts`
- Menyediakan endpoint health check (`GET /health`) dan monitoring socket room (`GET /api/socket-rooms`).
- Menjalankan Socket.io event: `join-order` dan `driver-location`.

### 3. `src/controllers/`
- **`authController.ts`**:
  - `register`: Hashing password dengan `bcryptjs` lalu simpan user ke database.
  - `login`: Verifikasi kredensial dan generate JWT Token dengan payload `{ userId, role }`.
- **`restaurantController.ts`**:
  - `getAllRestaurants`: Mengambil daftar restoran beserta kategorinya.
  - `getRestaurantById`: Mengambil restoran spesifik.
  - `getRestaurantMenu`: Mengambil menu restoran tertentu.
- **`orderController.ts`**:
  - `createOrder`: Menghitung total harga dan menyimpan order beserta `orderItems`.
  - `getMyOrders`: Mengambil riwayat pesanan milik user aktif dengan relasi menu, payment, serta dukungan paginasi database (`skip`, `take`, `page`, `limit`).
  - `getOrderById`: Mengambil detail pesanan tertentu beserta item dan pembayarannya.
- **`deviceController.ts`**:
  - `registerDevice`: Menyimpan token push notification perangkat user ke database dengan mekanisme `prisma.deviceToken.upsert`.
- **`paymentController.ts`**:
  - `createPayment`: Membuat record pembayaran untuk order dengan status `PENDING`.
  - `simulatePayment`: Mensimulasikan pembayaran (`PAID` atau `FAILED`), mengubah status order (`CONFIRMED` jika `PAID`), dan otomatis memicu push notification ke perangkat user.
  - `getPaymentByOrderId`: Mengambil informasi pembayaran dari order terkait.

### 4. `src/services/notificationService.ts`
- `getUserTokens(userId)`: Mengambil semua device token milik user.
- `sendNotificationToUser(userId, payload)`: Mengirim push notification ke semua perangkat user melalui endpoint Expo Push API (`https://exp.host/--/api/v2/push/send`).
- `NOTIFICATION_EVENTS`: Template notifikasi terstandar (`ORDER_CREATED`, `PAYMENT_SUCCESS`, `ORDER_CONFIRMED`, `DRIVER_ASSIGNED`, `ORDER_COMPLETED`).

### 5. `src/utils/calculateTotal.ts` & `calculateTotal.test.ts`
- Fungsi murni (*pure function*) penghitung subtotal harga pesanan.
- Unit test menggunakan Jest & `ts-jest` untuk menguji fungsionalitas positif dan penanganan keranjang kosong (negative test case).

---

## 📱 Bagian 2: Mobile (React Native + Expo SDK 57)
Berlokasi di folder `/mobile`.

### 1. `App.tsx`
- Root component yang membungkus aplikasi dengan `ReduxProvider`, `AuthProvider`, `CartProvider`.
- Menyertakan komponen internal `NotificationSync` yang meminta izin notifikasi via `registerForPushNotifications()` dan menyinkronkan token perangkat ke backend saat pengguna login.

### 2. `src/services/`
- **`api.ts`**: Instance Axios terpusat dengan request interceptor otomatis menyisipkan header `Authorization: Bearer <token>` dari AsyncStorage dan response interceptor untuk error logging yang jelas.
- **`notification.ts`**: Helper `expo-notifications` untuk meminta izin push notification, mengatur channel Android, dan mendaftarkan foreground notification handler.
- **`deviceApi.ts`**: Memanggil endpoint `POST /api/devices` untuk mendaftarkan token ke server.
- **`paymentApi.ts`**: Memanggil endpoint `POST /api/payments` dan `POST /api/payments/simulate`.
- **`orderApi.ts`**: Memanggil endpoint order backend (`createOrder`, `getMyOrders`, `getOrderById`).
- **`socket.ts`**: Client Socket.io dengan auto-reconnect dan helper `joinOrderRoom(orderId)`.

### 3. `src/context/`
- **`AuthContext.tsx`**: Mengelola status autentikasi pengguna, login, register, logout, serta pemulihan sesi otomatis dari `AsyncStorage`.
- **`CartContext.tsx`**: Mengelola keranjang belanja (`items`, `addToCart`, `removeFromCart`, `clearCart`, `totalPrice`, `totalItems`).

### 4. `src/store/` (Redux Toolkit)
- **`orderSlice.ts`**: Mengatur status alur transaksi order (`idle`, `loading`, `success`, `failed`), `items`, dan `orderId`.

### 5. `src/screens/`
- **`HomeScreen.tsx`**: Menampilkan daftar restoran, banner promosi, kategori, dan tombol pintas navigasi.
- **`RestaurantDetailScreen.tsx`**: Menampilkan detail restoran dan daftar menu dengan tombol tambah/kurang ke keranjang belanja.
- **`CheckoutScreen.tsx`**:
  - Ringkasan alamat pengiriman dan daftar menu yang dipesan.
  - Pemilihan metode pembayaran (QRIS, GoPay, Virtual Account, Tunai).
  - Eksekusi pembuatan order dan transaksi pembayaran.
  - **Payment Simulator Modal**: Menguji simulasi pembayaran `PAID` atau `FAILED` secara langsung.
  - Mengosongkan keranjang belanja setelah pembayaran berhasil dan menyediakan tombol navigasi ke pelacakan kurir.
- **`OrderHistoryScreen.tsx`**: Menampilkan riwayat pesanan dengan `FlatList`, status order, status pembayaran, dan metode bayar.
- **`OrderTrackingScreen.tsx`**: Pelacakan posisi kurir di peta OpenStreetMap + Leaflet secara live via Socket.io.
- **`DriverSimulatorScreen.tsx`**: Simulasi driver bergerak menyusuri titik jalan Jakarta untuk menguji live tracking.

---

## 🔄 Rangkuman Alur Kerja Lengkap (End-to-End Flow)

Berikut skenario saat pengguna melakukan pemesanan lengkap:

1. **Login & Sinkronisasi Token**:
   Pengguna login di `LoginScreen`. Token JWT disimpan di `AsyncStorage`. Komponen `NotificationSync` otomatis mengirimkan token push notification ke `POST /api/devices`.
2. **Pilih Restoran & Menu**:
   Pengguna memilih menu di `RestaurantDetailScreen`. Setiap klik `(+)` memperbarui `CartContext`.
3. **Checkout**:
   Pengguna membuka `CheckoutScreen`, memilih metode pembayaran (misal: QRIS), lalu menekan tombol "Lanjut ke Pembayaran".
4. **Pembuatan Order & Transaksi Pembayaran**:
   - Mobile memanggil `POST /api/orders` ➔ Order berstatus `PENDING` tersimpan di database.
   - Mobile memanggil `POST /api/payments` ➔ Payment berstatus `PENDING` tersimpan di database.
5. **Simulasi Pembayaran (Simulator Modal)**:
   - Pengguna menekan tombol "Simulasi Berhasil (PAID)".
   - Mobile memanggil `POST /api/payments/simulate` dengan status `PAID`.
   - Backend mengupdate payment menjadi `PAID` dan order menjadi `CONFIRMED`.
   - Backend memicu fungsi `sendNotificationToUser` yang mengirim push notification ke perangkat user.
   - Keranjang belanja dikosongkan (`clearCart()`).
6. **Pelacakan Kurir Real-Time**:
   Pengguna diarahkan ke `OrderTrackingScreen`. Client bergabung ke Socket room `order:{orderId}` dan mendengarkan pergerakan kurir secara live.
7. **Riwayat Pesanan**:
   Di `OrderHistoryScreen`, pesanan tercatat dengan status `CONFIRMED` dan pembayaran `QRIS • PAID`.
