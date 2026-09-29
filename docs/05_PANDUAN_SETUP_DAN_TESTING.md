# 🚀 05. Panduan Menjalankan & Pengujian (Testing Guide)

Dokumen ini memandu Anda dalam menyiapkan environment, menjalankan server backend & aplikasi mobile, serta melakukan pengujian end-to-end secara komprehensif.

---

## 1. Menjalankan Backend Server

### Langkah 1: Pindah ke Direktori Backend
```bash
cd backend
```

### Langkah 2: Konfigurasi Environment (`.env`)
Pastikan file `.env` di direktori `backend/` memiliki nilai yang sesuai:
```env
DATABASE_URL="postgresql://sulaimansaleh:08812216654MANZ@localhost:5432/gofood_db?schema=public"
JWT_SECRET="gofood-secret-key-super-aman"
PORT=3000
```

### Langkah 3: Sinkronisasi Skema Database & Generate Client
```bash
npx prisma db push
npx prisma generate
```

### Langkah 4: Seeding Data Restoran & Menu Awal (Opsional jika DB baru)
```bash
npm run seed
```

### Langkah 5: Jalankan Server Development
```bash
npm run dev
```
Server akan aktif di: `http://0.0.0.0:3000` (dapat diakses dari localhost maupun IP LAN perangkat mobile).

---

## 2. Menjalankan Mobile App (Expo)

### Langkah 1: Pindah ke Direktori Mobile
```bash
cd mobile
```

### Langkah 2: Konfigurasi IP Backend (`.env`)
Buka file `mobile/.env` dan pastikan alamat IP mengarah ke IP lokal komputer Anda pada jaringan Wi-Fi:
```env
EXPO_PUBLIC_API_URL=http://192.168.88.3:3000/api
```
*(Ganti `192.168.88.3` dengan IP lokal laptop/komputer Anda jika berpindah jaringan Wi-Fi)*.

### Langkah 3: Jalankan Expo Development Server
```bash
npx expo start
```
- Tekan **`i`** untuk membuka di iOS Simulator.
- Tekan **`a`** untuk membuka di Android Emulator.
- Atau scan QR code menggunakan aplikasi **Expo Go** pada smartphone fisik Anda.

---

## 3. Pengujian API Melalui Terminal (cURL)

Anda dapat menguji seluruh endpoint secara independen menggunakan perintah cURL berikut:

### A. Uji Registrasi Akun Baru
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Budi Santoso",
    "email": "budi@mail.com",
    "password": "password123"
  }'
```

### B. Uji Login Akun & Mendapatkan JWT
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "budi@mail.com",
    "password": "password123"
  }'
```
*Salin nilai `"token"` dari response untuk pengujian endpoint berikutnya.*

### C. Uji Buat Pesanan (Protected dengan JWT)
```bash
# Simpan token ke variable shell
TOKEN="<PASTE_TOKEN_JWT_DI_SINI>"

curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      {
        "menuItemId": "ba6a533e-ce39-4db0-a6db-66073be98715",
        "quantity": 2,
        "price": 35000
      }
    ]
  }'
```

### D. Uji Lihat Riwayat Pesanan
```bash
curl -X GET http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4. Panduan Demonstrasi End-to-End di Aplikasi Mobile

Ikuti langkah-langkah skenario demo berikut untuk melihat interaksi penuh sistem:

1. **Autentikasi**:
   - Buka aplikasi. Anda akan disambut di halaman **Login**.
   - Masukkan email `budi@mail.com` dan password `password123`, lalu tekan **Masuk**.
2. **Eksplorasi Restoran & Keranjang**:
   - Di halaman utama (**Home**), pilih restoran yang diinginkan (misal: *Nasi Goreng Gila*).
   - Tekan tombol **(+)** pada menu untuk menambahkan item ke keranjang.
   - Bilah hijau **Lihat Keranjang (1)** akan muncul di bagian bawah. Tekan bilah tersebut untuk masuk ke **Checkout**.
3. **Proses Checkout**:
   - Di layar **Checkout**, periksa ringkasan menu, alamat pengantaran, dan rincian biaya.
   - Tekan tombol hijau **Pesan Sekarang**.
   - Order akan terkirim ke backend API dan Redux akan mencatat `status: success` beserta `Order ID`.
4. **Pelacakan Real-time (Live Tracking)**:
   - Pilih opsi **Lacak Pesanan** pada dialog konfirmasi.
   - Layar **Order Tracking** akan terbuka dan terhubung secara otomatis ke Room pesanan tersebut via Socket.io.
5. **Simulasi Gerakan Driver**:
   - Tekan tombol **Simulator** di pojok kanan atas layar tracking.
   - Anda akan diarahkan ke layar **Driver Simulator** dengan `Order ID` yang sudah terisi otomatis.
   - Tekan tombol biru **Jalankan Rute Otomatis (5 Titik)**.
   - Kembali ke layar tracking: Anda akan melihat koordinat lintang & bujur serta status perjalanan driver ter-update secara berkala **tanpa perlu me-refresh halaman**!
