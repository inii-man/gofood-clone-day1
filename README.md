# GoFood Clone — Day 1

Hands-on project berdasarkan materi Hari 1: Mobile Fullstack Development. Aplikasi ini adalah *clone* sederhana dari GoFood yang terdiri dari backend menggunakan Node.js (Express + Prisma) dan mobile app menggunakan React Native (Expo).

## 📱 Fitur (Day 1 Scope)
- **Mobile (React Native + Expo)**: 
  - GoFood Home Screen (Daftar Restoran & Promosi)
  - Restaurant Detail Screen (Menu Makanan)
  - Native Stack Navigation untuk perpindahan halaman
  - Context API untuk manajemen state Keranjang (Cart)
- **Backend (Node.js + Express)**:
  - Database PostgreSQL menggunakan Prisma ORM
  - RESTful API dengan TypeScript
  - Prisma Seed untuk dummy data awal
- **Integrasi**: Mobile app dapat mengambil data dari Backend API.

## 🗂️ Struktur Proyek

```text
gofood-clone-day1/
├── mobile/                   # Aplikasi React Native (Expo)
│   ├── src/                  # Kode utama (components, screens, navigation, dll)
│   ├── .env.example          # Template environment variable
│   ├── App.tsx               # Entry point aplikasi
│   └── package.json
├── backend/                  # REST API server (Express.js)
│   ├── prisma/               # Schema database & seeder
│   ├── src/                  # Controller, Route, dan konfigurasi Express
│   ├── .env.example
│   └── package.json
└── README.md
```

## 🚀 1. Persiapan Backend (Node.js)

Masuk ke folder backend, atur *environment variable*, dan jalankan aplikasinya:

```bash
cd backend
cp .env.example .env
npm install
```

**Inisialisasi Database:**
Pastikan PostgreSQL Anda sudah berjalan dan URL koneksinya benar di file `.env`.
```bash
npx prisma generate
npx prisma db push
npm run seed
```

**Jalankan Server Backend:**
```bash
npm run dev
```

Server backend akan berjalan di `http://localhost:5000` (atau port lain sesuai konfigurasi Anda). 
Anda bisa mengujinya:
- `curl http://localhost:5000/health`
- `curl http://localhost:5000/api/restaurants`

## 📱 2. Persiapan Mobile (Expo)

Agar aplikasi *mobile* bisa mengakses backend di komputer, Anda harus menggunakan alamat IP lokal (LAN IP) komputer Anda.

1. Buka tab terminal baru dan cek IP lokal Anda (misalnya: jalankan perintah `ifconfig` di Mac/Linux atau `ipconfig` di Windows).
2. Masuk ke folder `mobile` dan salin `.env`:
   ```bash
   cd mobile
   cp .env.example .env
   npm install
   ```
3. Buka file `mobile/.env` lalu ubah URL dengan IP lokal Anda. (Sesuaikan port backend):
   ```env
   EXPO_PUBLIC_API_URL=http://<IP_KOMPUTER_ANDA>:5000/api
   ```
   *(Contoh: `http://192.168.88.3:5000/api`)*

**Jalankan Expo:**
```bash
npx expo start
```
Setelah terminal menampilkan QR code, Anda dapat membukanya menggunakan aplikasi **Expo Go** dari HP Android/iOS Anda yang berada di jaringan WiFi yang sama.

## ⚠️ Catatan Penting
- Jangan pernah melakukan *commit* pada file `.env` asli yang berisi password atau informasi sensitif lainnya ke Git.
- Pastikan HP dan komputer Anda terhubung dalam **jaringan WiFi yang sama** agar aplikasi Expo Go bisa mengakses backend lokal Anda.

---

## 🛠️ Troubleshooting & Tips Tambahan

Berikut adalah beberapa kendala yang sering terjadi dan cara mengatasinya:

### 1. Masalah Versi Node.js & Expo SDK
Expo versi terbaru (misal SDK 52/57) mensyaratkan versi Node.js yang cukup baru (minimal `v20.19.x` atau `v22.x`). Jika Anda mendapatkan *error* `EBADENGINE` atau `Unsupported engine`, perbarui Node.js Anda:
```bash
# Jika Anda menggunakan n (Node Version Management)
sudo n lts
```
Setelah Node diperbarui, selalu pastikan *dependencies* Expo Anda sinkron dengan versinya:
```bash
cd mobile
npm install expo@latest
npx expo install --fix
```

### 2. Expo Go Mendesak Anda untuk Login
Dalam beberapa kasus, saat aplikasi dijalankan, Expo Go mungkin menolak untuk membuka aplikasi lokal Anda sebelum Anda *login* di CLI.
- Hentikan server Expo (`Ctrl + C`).
- Jalankan `npx expo login` di terminal.
- Masukkan *Email/Username* dan *Password*.
- **Catatan:** Jika Anda mendaftar Expo menggunakan tombol "Continue with Google" (Gmail), Anda tidak memiliki password bawaan. Silakan kunjungi [expo.dev](https://expo.dev) > Account Settings > Password, lalu buat password baru di sana sebelum *login* di CLI.

### 3. Masalah Jaringan Lokal (Gagal Scan QR)
Walaupun HP dan Laptop di WiFi yang sama, terkadang setelan *Firewall* OS atau *AP Isolation* pada Router memblokir koneksi, sehingga HP Anda *loading* terus saat men-*scan* QR code.
**Solusinya adalah menggunakan Tunnel:**
```bash
cd mobile
npm install -D @expo/ngrok
npx expo start --tunnel
```
Cara ini merutekan koneksi secara aman melalui internet, dan QR Code dapat di-scan meskipun tidak berada dalam jaringan WiFi yang sama.
