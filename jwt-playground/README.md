# 🔑 JWT Simple Playground (GoFood Clone)

Folder ini adalah lingkungan eksperimen (**Playground**) sederhana dan interaktif untuk mempelajari cara kerja **JSON Web Token (JWT)**, bagaimana token ditandatangani secara kriptografi, dan bagaimana backend GoFood memverifikasi setiap request yang masuk.

---

## 📂 Isi Folder

```text
jwt-playground/
├── index.html        # Playground visual interaktif berbasis browser (Buka langsung di browser)
├── playground.js     # Script demonstrasi interaktif via terminal Node.js (Tanpa install library)
└── README.md         # Dokumentasi konsep & panduan penggunaan
```

---

## 🚀 2 Cara Menjalankan Playground

### Cara 1: Menggunakan Terminal (Node.js Script)
Jalankan script `playground.js` dengan Node.js bawaan tanpa perlu menginstal dependensi tambahan:
```bash
cd jwt-playground
node playground.js
```
**Apa yang akan Anda lihat di terminal?**
1. Pembuatan 3 bagian JWT (Header, Payload, Signature) dari data pengguna GoFood Budi Santoso.
2. Hasil token lengkap dengan pewarnaan terminal (Merah, Ungu, Biru).
3. Verifikasi token oleh simulasi backend middleware.
4. **Simulasi Peretasan**: Mencoba memalsukan `role: "CUSTOMER"` menjadi `"ADMIN"` dan melihat bagaimana server otomatis **menolak request** karena signature tidak cocok.

---

### Cara 2: Menggunakan Browser (Visual Web UI)
Cukup buka file [**`index.html`**](file:///Users/sulaimansaleh/Documents/uob-fullstack-mobile/gofood-clone-day1/jwt-playground/index.html) dengan cara:
- Klik ganda file `index.html` di Finder / File Explorer, atau
- Buka terminal dan ketik:
  ```bash
  open index.html
  ```

**Fitur di Web Playground:**
- 📱 **Simulasi Login Lengkap**:
  - Input email & password pada tampilan mockup HP GoFood.
  - Lihat log server real-time: pengecekan database, `bcrypt.compare()`, pembuatan token `jwt.sign()`, dan penyimpanan di `AsyncStorage`.
  - **Uji 3 Skenario Protected API (`/api/orders`)**:
    1. *Request dengan Token Sah* ➔ Server memvalidasi token dan mengembalikan daftar pesanan (`200 OK`).
    2. *Request tanpa Token* ➔ Dicegat oleh middleware (`401 Unauthorized: Authentication required`).
    3. *Request dengan Token Palsu/Dimanipulasi* ➔ Signature tidak cocok (`401 Unauthorized: Invalid token`).
- 🎨 **Color Highlight**: Bagian Header (Merah), Payload (Ungu), dan Signature (Biru) ditampilkan secara terpisah sesuai standar industri (seperti di jwt.io).
- ✍️ **Live Editor**: Edit payload secara real-time (misal ubah nama atau email) dan saksikan encoded token terbuat secara otomatis menggunakan Web Crypto API.
- 🎭 **Tombol Eksperimen Hacker**: Klik tombol *"Ubah Role jadi ADMIN"* untuk melihat bagaimana tamper detector langsung mendeteksi kecurangan dan menampilkan peringatan **Signature Mismatch**.
- 🕒 **Tombol Token Expired**: Simulasikan token kadaluarsa dalam 1 kali klik.

---

## 🧠 Konsep Penting JWT

### 1. Anatomi Token
JWT terdiri dari **tiga bagian yang dipisahkan oleh tanda titik (`.`)**:
$$\text{Token} = \text{Header} . \text{Payload} . \text{Signature}$$

| Bagian | Warna | Fungsi | Contoh Data |
|---|---|---|---|
| **Header** | 🔴 Merah | Menyatakan algoritma enkripsi & tipe token | `{"alg": "HS256", "typ": "JWT"}` |
| **Payload** | 🟣 Ungu | Menyimpan klaim / data identitas user | `{"userId": "123", "role": "CUSTOMER"}` |
| **Signature** | 🔵 Biru | Tanda tangan digital pembuktian keaslian | `HMACSHA256(Header + "." + Payload, SECRET)` |

---

### 2. Mengapa GoFood Menggunakan JWT (Stateless)?
- **Tanpa Session Database**: Server tidak perlu query ke tabel sesi di database setiap kali pelanggan membuka halaman atau checkout.
- **Sangat Cepat**: Middleware `authMiddleware.ts` hanya perlu memverifikasi tanda tangan digital token menggunakan rumus matematika HMAC-SHA256 dengan secret key `process.env.JWT_SECRET`.
- **Mudah di-scale**: Server backend dapat diperbanyak menjadi puluhan instance tanpa perlu memikirkan sinkronisasi sesi database antar server.

---

### 3. Aturan Emas Keamanan JWT ⚠️
1. **Payload BUKAN Rahasia**: Data di dalam payload hanya di-encode dalam format Base64Url (siapapun bisa men-decode dan membacanya). **JANGAN PERNAH** menyimpan password, PIN, atau data sensitif di dalam payload JWT!
2. **Jaga Rahasia `JWT_SECRET`**: Hanya backend server yang boleh mengetahui kunci ini. Jika kunci ini bocor, peretas dapat membuat token palsu dengan otoritas apapun.
