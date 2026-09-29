# 📚 Dokumentasi Lengkap GoFood Clone (Day 1 & Day 2)

Selamat datang di dokumentasi resmi arsitektur, kode, dan alur aplikasi **GoFood Clone**. Dokumentasi ini dirancang untuk memberikan pemahaman menyeluruh baik secara konseptual (high-level architecture) maupun teknis (deep-dive source code).

---

## 📑 Daftar Isi Dokumentasi

| Dokumen | Topik Pembahasan |
|---|---|
| [**01. Arsitektur & Overview Aplikasi**](./01_ARSITEKTUR_DAN_OVERVIEW.md) | Visi aplikasi, teknologi stack, arsitektur monorepo/multi-repo, dan skema database (ERD). |
| [**02. Alur & Flow Aplikasi (End-to-End)**](./02_ALUR_FLOW_APLIKASI.md) | Sequence diagram & alur: Auth JWT, Cart & Redux Checkout, Order Lifecycle, dan Real-time Driver Tracking Socket.io. |
| [**03. Bedah Kode Backend (Deep-Dive)**](./03_BEDAH_KODE_BACKEND.md) | Penjelasan kode backend: Express server, Prisma ORM, Auth Controller, Order Controller, JWT Middleware, dan Socket.io Server. |
| [**04. Bedah Kode Mobile (Deep-Dive)**](./04_BEDAH_KODE_MOBILE.md) | Penjelasan kode frontend: Expo React Native, Context API vs Redux Toolkit, AsyncStorage, Axios Interceptors, Socket Client, dan Screen Navigation. |
| [**05. Panduan Menjalankan & Testing**](./05_PANDUAN_SETUP_DAN_TESTING.md) | Panduan langkah demi langkah menjalankan backend, mobile, migrasi database, simulasi driver, dan instruksi cURL testing. |

---

## 🎯 Gambaran Umum Aplikasi

Aplikasi ini adalah sistem pemesanan makanan berbasis mobile (*on-demand food delivery*) yang terbagi menjadi dua bagian utama:
1. **`backend`**: REST API & WebSocket Server berbasis **Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, dan Socket.io**.
2. **`mobile`**: Aplikasi mobile lintas platform berbasis **React Native, Expo, TypeScript, Context API, Redux Toolkit, dan Socket.io-Client**.

### Fitur Utama:
- 🔐 **Autentikasi Aman**: Registrasi, Login, Password Hashing (`bcryptjs`), dan Token JWT (`jsonwebtoken`).
- 🏬 **Katalog Restoran & Menu**: Menampilkan promo, kategori makanan, rating, estimasi waktu antar, dan daftar menu.
- 🛒 **State Management Fleksibel**:
  - **Context API**: Mengelola keranjang belanja (*cart*) & sesi autentikasi (*user token*).
  - **AsyncStorage**: Menjaga sesi login tetap aktif meski aplikasi ditutup (*persistent session*).
  - **Redux Toolkit**: Mengelola alur transaksi checkout & status pesanan (*order flow state*).
- 📦 **Order Management**: Pembuatan order dari cart, kalkulasi total harga otomatis, dan riwayat pesanan (*order history*).
- 🛵 **Live Tracking Real-time**: Pelacakan pergerakan driver secara langsung via **Socket.io Room** tanpa perlu polling API atau refresh halaman.
- 🎮 **Driver Simulator**: Antarmuka bawaan untuk mensimulasikan pergerakan kurir secara bertahap sepanjang rute pengantaran.
