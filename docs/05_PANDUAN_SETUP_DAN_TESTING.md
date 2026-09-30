# 🚀 05. Panduan Menjalankan & Pengujian (Testing Guide)

Dokumen ini memandu Anda dalam menyiapkan environment, menjalankan server backend & aplikasi mobile, mengeksekusi unit test otomatis, serta melakukan pengujian end-to-end secara komprehensif hingga fitur Day 3 (Push Notification & Payment Simulator).

---

## 1. Menjalankan Backend Server

### Langkah 1: Pindah ke Direktori Backend
```bash
cd backend
```

### Langkah 2: Konfigurasi Environment (`.env`)
Pastikan file `.env` di direktori `backend/` memiliki nilai yang sesuai:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/gofood_db?schema=public"
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

### Langkah 5: Eksekusi Automated Unit Testing (Jest)
Jalankan unit test untuk memastikan kalkulasi harga pesanan berjalan benar:
```bash
npm test
```
*Hasil yang diharapkan:*
```text
PASS src/utils/calculateTotal.test.ts
  calculateTotal
    ✓ calculates order total
    ✓ returns zero for empty cart

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

### Langkah 6: Jalankan Server Development
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
Cek IP aktif komputer Anda (`ipconfig getifaddr en0`) lalu perbarui `mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://<IP_KOMPUTER_ANDA>:3000/api
```

### Langkah 3: Jalankan Expo Development Server
```bash
npx expo start -c
```
- Tekan **`i`** untuk membuka di iOS Simulator.
- Tekan **`a`** untuk membuka di Android Emulator.
- Atau scan QR code dari smartphone fisik menggunakan aplikasi **Expo Go** (disarankan untuk menguji notifikasi push nyata).

---

## 🧪 3. Pengujian API via cURL

### A. Login untuk Mendapatkan Token JWT
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "budi@mail.com", "password": "password123" }'
```
*Salin token dari field `token` pada response JSON.*

---

### B. Uji Simpan Device Token (Push Notification)
```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Authorization: Bearer <TOKEN_ANDA>" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[AbCdEf1234567890]",
    "platform": "mobile"
  }'
```
*Expected: HTTP 200 `{ "success": true, "data": { ... } }`.*

---

### C. Uji Buat Transaksi Pembayaran
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer <TOKEN_ANDA>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "<ORDER_ID_DARI_DATABASE>",
    "method": "QRIS"
  }'
```
*Expected: HTTP 201 `{ "success": true, "data": { "status": "PENDING", ... } }`.*

---

### D. Uji Simulator Pembayaran (PAID)
```bash
curl -X POST http://localhost:3000/api/payments/simulate \
  -H "Authorization: Bearer <TOKEN_ANDA>" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "<PAYMENT_ID>",
    "status": "PAID"
  }'
```
*Expected:*
1. HTTP 200 `{ "success": true, "data": { "status": "PAID" }, "order": { "status": "CONFIRMED" } }`.
2. Di terminal server backend akan muncul log:
   `🔔 [PUSH] Mengirim notifikasi ke userId "..." : "Pembayaran Berhasil"`

---

## 📱 4. Pengujian End-to-End dari Aplikasi Mobile

Untuk memvalidasi skenario lengkap dari sisi pengguna:

1. **Buka Aplikasi & Login**:
   - Masuk menggunakan tombol **"Demo Customer (Budi)"**.
   - Perhatikan log terminal: `[PUSH] Device token berhasil terdaftar untuk user yang sedang aktif`.
2. **Pilih Makanan**:
   - Klik salah satu restoran (misal: "Nasi Goreng Gila Gondangdia").
   - Tambahkan menu ke keranjang dengan menekan ikon `(+)`.
3. **Checkout**:
   - Tekan tombol **"Lihat Keranjang"** atau navigasi ke Checkout.
   - Pilih metode pembayaran: **"QRIS Gopay / BCA / Mandiri"**.
   - Tekan tombol **"Lanjut ke Pembayaran"**.
4. **Simulator Pembayaran**:
   - Modal simulator pembayaran akan muncul dengan nominal tagihan dan Order ID.
   - Tekan tombol hijau **"Simulasi Berhasil (PAID)"**.
   - Notifikasi push akan dipicu dari backend, status order berubah menjadi `CONFIRMED`, dan muncul notifikasi sukses.
5. **Pelacakan Kurir Real-Time**:
   - Tekan **"Lacak Pesanan"** di dialog sukses.
   - Layar pelacakan kurir akan menampilkan peta Jakarta live dan posisi motor bergerak menyusuri jalan.
6. **Periksa Riwayat Pesanan**:
   - Buka menu **"Riwayat"**.
   - Pesanan Anda akan tercatat dengan status `CONFIRMED` dan label `QRIS • PAID`.
