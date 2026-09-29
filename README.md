# 🍕 GoFood Clone — Fullstack Mobile (Day 1 & Day 2)

Hands-on project pembelajaran Fullstack Mobile Development (**GoFood Clone**). Terdiri dari backend REST API & WebSocket menggunakan **Node.js, Express, Prisma ORM, PostgreSQL, dan Socket.io**, serta aplikasi mobile cross-platform menggunakan **React Native (Expo SDK 57), TypeScript, Context API, Redux Toolkit, dan OpenStreetMap**.

---

## 📱 Cakupan Fitur Aplikasi

### **Day 1: Store & Food Catalog**
- 🏬 **Katalog Restoran & Menu**: Menampilkan banner promo, kategori makanan, rating, estimasi waktu, dan daftar menu makanan.
- 🛒 **Cart Management**: Context API (`CartContext`) untuk menambah, menghapus, dan menghitung total belanja.
- 🗄️ **Database & Seeder**: PostgreSQL + Prisma ORM dengan data awal restoran & makanan.

### **Day 2: From Cart to Live Order**
- 🔐 **Autentikasi & Otorisasi**: Registrasi, Login, Password Hashing (`bcryptjs`), Token JWT (`jsonwebtoken`), dan sesi login persisten via `AsyncStorage`.
- ⚙️ **Advanced State Management**: Redux Toolkit (`orderSlice`) untuk mengelola lifecycle checkout pesanan (`idle` ➔ `loading` ➔ `success` / `failed`).
- 📦 **Order Management**: Pembuatan pesanan (`POST /api/orders`) terproteksi JWT, kalkulasi total harga otomatis di backend, dan riwayat pesanan (`GET /api/orders`).
- 🛵 **Real-time Driver Tracking**: Pelacakan posisi kurir secara instan menggunakan **Socket.io Rooms** (`order:{orderId}`).
- 🗺️ **Peta Interaktif Live (OpenStreetMap + Leaflet)**: Visualisasi peta nyata tanpa perlu Google Maps API Key.
- 🎮 **In-Screen Driver Simulator**: Simulasi pergerakan motor kurir nyata menyusuri 12 titik jalan raya Jakarta (*Sudirman ➔ Semanggi ➔ Senayan*).

---

## 🗂️ Struktur Proyek

```text
gofood-clone-day1/
├── backend/                  # REST API & WebSocket Server (Express + Socket.io + Prisma)
│   ├── prisma/               # Schema PostgreSQL & Seeder data
│   ├── src/                  # Controllers, Routes, Middleware, & server.ts
│   ├── .env.example
│   └── package.json
├── mobile/                   # Aplikasi Mobile React Native (Expo)
│   ├── src/
│   │   ├── components/       # SearchBar, CategoryItem, RestaurantCard, TrackingMap
│   │   ├── context/          # AuthContext (AsyncStorage), CartContext
│   │   ├── navigation/       # AppNavigator (Auth Guard & Native Stack)
│   │   ├── screens/          # Login, Register, Home, Detail, Checkout, History, Tracking, Simulator
│   │   ├── services/         # api.ts (Axios + Interceptor), orderApi.ts, socket.ts
│   │   └── store/            # Redux Toolkit (orderSlice, store.ts)
│   ├── .env.example
│   ├── App.tsx               # Root Provider Wrapper
│   └── package.json
├── docs/                     # 📚 Dokumentasi lengkap arsitektur, kode, & alur aplikasi
│   ├── 01_ARSITEKTUR_DAN_OVERVIEW.md
│   ├── 02_ALUR_FLOW_APLIKASI.md
│   ├── 03_BEDAH_KODE_BACKEND.md
│   ├── 04_BEDAH_KODE_MOBILE.md
│   └── 05_PANDUAN_SETUP_DAN_TESTING.md
├── jwt-playground/           # 🔑 Playground visual & interaktif untuk belajar JWT & Login
│   ├── index.html            # Web UI playground (jwt.io style + simulasi login)
│   └── playground.js         # Script Node.js native crypto
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

3. **Inisialisasi Database:**
   ```bash
   npx prisma db push
   npx prisma generate
   npm run seed
   ```

4. **Jalankan Server:**
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

## 🛠️ Troubleshooting & Panduan Solusi Error

### 🔴 1. Student Bisa Login, Tapi Saat Checkout Muncul Error `401 Unauthorized`
Ini adalah kendala yang paling sering dialami peserta:

- **Penyebab Utama**: Token JWT tidak terkirim di header HTTP saat memanggil `POST /api/orders`. Di slide materi Day 2 belum menyertakan kode Axios Interceptor.
- **Solusi**: Pastikan di `mobile/src/services/api.ts` sudah dipasang **Request Interceptor**:
  ```typescript
  import AsyncStorage from '@react-native-async-storage/async-storage';

  api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Wajib format: Bearer <spasi> token
    }
    return config;
  });
  ```
- **Penyebab Kedua (Beda nama field payload)**:
  - Di `authController.ts` token di-generate dengan: `{ userId: user.id }`.
  - Di `orderController.ts` student membaca: `req.user.id` (bukan `req.user.userId`), sehingga bernilai `undefined`.
  - **Solusi**: Gunakan fallback `const userId = req.user?.userId || req.user?.id;`.

---

### 🔴 2. Error `API TIMEOUT 10000MS` / Gagal Terhubung ke Server
- **Penyebab**: Alamat IP laptop/komputer Anda berubah (misalnya setelah berganti koneksi Wi-Fi).
- **Solusi**:
  1. Cek kembali IP aktif Anda: `ipconfig getifaddr en0`.
  2. Buka `mobile/.env` dan perbarui `EXPO_PUBLIC_API_URL` dengan IP baru.
  3. Restart Expo dengan flag cache bersih: `npx expo start -c`.

---

### 🔴 3. Error `listen EADDRINUSE: address already in use 0.0.0.0:3000`
- **Penyebab**: Proses node backend sebelumnya masih berjalan di background dan belum tertutup sempurna.
- **Solusi**:
  ```bash
  # Cari dan matikan proses yang menggunakan port 3000:
  lsof -ti :3000 | xargs kill -9
  ```
  Lalu jalankan kembali `npm run dev`.

---

## 📚 Folder Dokumentasi & Playground Khusus

1. **Dokumentasi Lengkap Proyek**:
   Pelajari detail arsitektur, flow bisnis, dan bedah kode line-by-line di folder [**`docs/`**](./docs/README.md).
2. **Interactive JWT Playground**:
   Buka playground visual untuk memahami anatomi token, tampering/hacking detector, dan simulasi login di folder [**`jwt-playground/`**](./jwt-playground/README.md).
   ```bash
   open jwt-playground/index.html
   ```
