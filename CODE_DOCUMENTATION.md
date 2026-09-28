# Dokumentasi Kode: GoFood Clone (Day 1)

Dokumen ini menjelaskan struktur kode, arsitektur, dan alur kerja aplikasi secara menyeluruh dari sisi Backend maupun Mobile. 

---

## 🏗️ Arsitektur Sistem Umum

Aplikasi ini menggunakan pola **Client-Server**:
1. **Client (Mobile)**: Dibangun dengan **React Native (Expo)**. Bertugas menampilkan Antarmuka Pengguna (UI) dan berinteraksi dengan pengguna.
2. **Server (Backend)**: Dibangun dengan **Node.js, Express, dan TypeScript**. Bertugas melayani *request* data (REST API).
3. **Database**: Menggunakan **PostgreSQL** dengan **Prisma ORM** sebagai penghubungnya.

Alur data secara sederhana:
**Mobile (Axios)** ➡️ **Backend (Express Route -> Controller)** ➡️ **Prisma ORM** ➡️ **PostgreSQL** ➡️ (kembali ke UI)

---

## 🗄️ Bagian 1: Backend (Node.js + Express)
Berlokasi di folder `/backend`.

### 1. `prisma/schema.prisma`
Ini adalah inti dari struktur *database*. Terdapat dua model utama:
- `Restaurant`: Menyimpan data restoran (nama, rating, ongkir, dsb).
- `MenuItem`: Menyimpan data makanan yang terhubung ke sebuah `Restaurant` lewat Relasi (`restaurantId`).

### 2. `src/server.ts`
Ini adalah titik awal (*entry point*) aplikasi Backend. File ini:
- Mempersiapkan *server* Express.
- Mengaktifkan CORS agar Mobile bisa mengambil data tanpa diblokir oleh keamanan browser/perangkat.
- Mendaftarkan semua *route* API (misal awalan `/api` diarahkan ke `restaurantRoutes.ts`).
- Menjalankan server pada port yang ditentukan (default `3000` atau `5000`).

### 3. `src/routes/restaurantRoutes.ts`
File ini adalah peta jalan (*router*). Di sini didefinisikan *endpoint* API apa saja yang tersedia:
- `GET /` $\rightarrow$ Mengambil semua restoran.
- `GET /:id` $\rightarrow$ Mengambil detail restoran berdasarkan ID.
- `GET /:id/menu` $\rightarrow$ Mengambil daftar menu untuk restoran tertentu.

### 4. `src/controllers/restaurantController.ts`
Di sinilah logika bisnis utama (*Business Logic*) berada. Saat *route* dipanggil, fungsi di controller akan bekerja:
- Mengambil parameter dari *request* (misalnya `req.params.id`).
- Menggunakan `prisma` untuk berinteraksi dengan *database* (misalnya `prisma.restaurant.findMany()`).
- Mengirimkan *response* berformat JSON kembali ke Mobile (dengan status `success: true` dan bungkus `data`).

### 5. `src/prisma/seed.ts`
Ini adalah skrip *seeder*. Berfungsi untuk memasukkan data awal secara otomatis ke *database* kosong agar kita punya bahan untuk dites (seperti restoran "Nasi Goreng Gila").

---

## 📱 Bagian 2: Mobile (React Native + Expo)
Berlokasi di folder `/mobile`.

### 1. `App.tsx`
Ini adalah titik awal aplikasi Mobile.
- Memuat file Navigasi Utama.
- Bisa juga digunakan untuk menaruh *Provider* pelindung aplikasi (seperti Redux, Context API, atau *Theme Provider*).

### 2. `src/navigation/AppNavigator.tsx`
Menggunakan library `@react-navigation/native-stack`. Berfungsi mengatur halaman apa saja yang ada di aplikasi dan mengatur pergerakan antar halaman.
- `Home`: Diarahkan ke komponen `HomeScreen`.
- `RestaurantDetail`: Diarahkan ke komponen `RestaurantDetailScreen`.

### 3. `src/services/api.ts`
File ini merupakan jembatan komunikasi ke Backend menggunakan **Axios**.
- Menarik URL dari file `.env` (`EXPO_PUBLIC_API_URL`).
- Menggunakan *interceptor* agar jika terjadi *error* (misalnya 404 atau 500), bisa otomatis masuk ke proses *error handling* atau di-*console.log*.
- Mengekspor fungsi bantuan (helper) seperti `getRestaurants()`, `getRestaurant(id)`, dan `getMenu(id)` agar dipanggil dengan mudah oleh layar UI.

### 4. `src/screens/HomeScreen.tsx`
Halaman utama saat aplikasi terbuka.
- Menggunakan `useState` untuk menyimpan data `restaurants`, `loading`, dan `error`.
- Memanfaatkan `useEffect` untuk otomatis memanggil fungsi `fetchRestaurants()` yang mengambil data dari API saat layar terbuka.
- Melakukan *Conditional Rendering*: 
  - Jika loading $\rightarrow$ tampilkan putaran (`ActivityIndicator`)
  - Jika error $\rightarrow$ tampilkan pesan gagal merah dan tombol Coba Lagi
  - Jika sukses $\rightarrow$ *mapping* data restoran menjadi kumpulan komponen `<RestaurantCard />`.

### 5. `src/screens/RestaurantDetailScreen.tsx`
Halaman detail saat sebuah restoran diklik.
- Menangkap data restoran yang dilempar dari layar sebelumnya lewat parameter navigasi (`route.params.restaurant`).
- Menggunakan `useEffect` untuk melakukan pemanggilan fungsi `fetchMenu()` dengan melempar ID restoran tersebut.
- Menampilkan UI data detail restoran (gambar besar di atas, nama, rating) dan melakukan *mapping* `menuItems` menjadi baris-baris daftar makanan.

### 6. Folder `src/components/`
Berisi potongan UI yang dapat digunakan kembali (*reusable*):
- `SearchBar.tsx`: Komponen untuk kotak pencarian visual.
- `CategoryItem.tsx`: Kotak kecil untuk ikon kategori (misal: "Terdekat", "Promo").
- `RestaurantCard.tsx`: Komponen kartu restoran yang menerima struktur data mentah dari `HomeScreen` lalu menampilkannya secara rapi dengan gambar dan teks.

---

## 🔄 Rangkuman Alur Kerja (Workflow)
Mari kita simulasikan apa yang terjadi secara program saat Anda membuka aplikasi:

1. User membuka aplikasi Mobile, `HomeScreen` muncul di layar.
2. `HomeScreen` menjalankan *hook* `useEffect`, yang kemudian memanggil `api.get('/restaurants')` via Axios.
3. *Request HTTP* meluncur ke Backend, diterima di `server.ts`, lalu diarahkan ke `restaurantRoutes.ts`.
4. Router meneruskannya ke `restaurantController.ts` pada fungsi `getAllRestaurants`.
5. Controller meminta bantuan Prisma untuk menarik data dari PostgreSQL (`prisma.restaurant.findMany()`).
6. Data berhasil didapat, lalu dibungkus ke format JSON dan dikembalikan (*return*) sebagai respon HTTP ke Axios di Mobile.
7. `HomeScreen` menerima data tersebut, merubah status `loading` menjadi `false`, dan mengisi state `restaurants` dengan data.
8. UI React Native langsung ter-update otomatis (*re-render*), mengubah *loading spinner* menjadi daftar kumpulan kartu restoran.
9. Saat satu kartu restoran diklik, objek restoran tersebut dilempar ke `RestaurantDetailScreen`, dan siklus pemanggilan API yang sama berulang lagi untuk menarik daftar Menu khusus restoran tersebut!
