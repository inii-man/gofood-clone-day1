# 🔄 02. Alur & Flow Aplikasi (End-to-End)

Dokumen ini menjelaskan alur bisnis dan teknis dari saat pengguna membuka aplikasi hingga pesanan diantar oleh kurir secara *real-time*.

---

## 1. Alur Autentikasi & Manajemen Sesi (JWT + AsyncStorage)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Pengguna
    participant Mobile as Mobile App (AuthContext)
    participant Storage as AsyncStorage
    participant API as Express API (/api/auth)
    participant DB as PostgreSQL

    alt Saat Aplikasi Pertama Kali Dibuka
        Mobile->>Storage: Cek 'auth_token' & 'auth_user'
        Storage-->>Mobile: Kembalikan token jika ada
        Mobile->>Mobile: Set state user (Auto Login)
    else Belum Ada Sesi / Pengguna Login Manual
        Customer->>Mobile: Input Email & Password
        Mobile->>API: POST /api/auth/login {email, password}
        API->>DB: Cari user berdasarkan email
        DB-->>API: Data User (passwordHash)
        API->>API: Validasi password via bcrypt.compare()
        API->>API: Buat JWT Token (userId, role, expired 1d)
        API-->>Mobile: Response {token, user}
        Mobile->>Storage: Simpan 'auth_token' & 'auth_user'
        Mobile->>Mobile: Update AuthContext state -> Navigasi ke Home
    end
```

---

## 2. Alur Pemesanan (Cart -> Redux -> Checkout -> Order API)

Strategi state management memisahkan keranjang belanja lokal dengan alur transaksi pemesanan:
- **`CartContext`**: Mengelola item yang ditambah/dikurangi di layar restoran.
- **`Redux orderSlice`**: Mengatur status checkout (`idle` ➔ `loading` ➔ `success` / `failed`) serta menyimpan `orderId` yang dihasilkan.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Pengguna
    participant Detail as RestaurantDetailScreen
    participant Cart as CartContext
    participant Checkout as CheckoutScreen
    participant Redux as Redux orderSlice
    participant API as Express API (/api/orders)
    participant DB as PostgreSQL

    Customer->>Detail: Klik tombol (+) pada menu makanan
    Detail->>Cart: addToCart(item)
    Cart->>Cart: Update items[], totalItems, totalPrice
    Customer->>Detail: Klik "Lihat Keranjang"
    Detail->>Checkout: Navigasi ke CheckoutScreen
    Checkout->>Redux: dispatch(setItems(cart.items))
    Customer->>Checkout: Klik "Pesan Sekarang"
    Checkout->>Redux: dispatch(setStatus('loading'))
    Checkout->>API: POST /api/orders (Header: Bearer Token, Body: items[])
    API->>API: Middleware authenticate (verifikasi token)
    API->>API: Hitung total harga & siapkan relasi items
    API->>DB: prisma.order.create({ data: { userId, totalPrice, items: {...} } })
    DB-->>API: Record Order baru + ID
    API-->>Checkout: 201 Created { success: true, data: order }
    Checkout->>Redux: dispatch(setOrderId(order.id))
    Checkout->>Redux: dispatch(setStatus('success'))
    Checkout->>Customer: Alert Pesanan Berhasil -> Opsi Lacak Pesanan
```

---

## 3. Siklus Hidup Status Pesanan (Order Lifecycle)

Setiap pesanan di sistem mengikuti alur status yang terdefinisi dengan jelas:

```mermaid
stateDiagram-v2
    [*] --> PENDING : User checkout pesanan
    PENDING --> CONFIRMED : Pesanan diterima sistem/merchant
    CONFIRMED --> PREPARING : Makanan sedang dimasak oleh dapur
    PREPARING --> READY : Makanan selesai dikemas & siap diantar
    READY --> PICKED_UP : Driver mengambil pesanan dari resto
    PICKED_UP --> DELIVERING : Driver dalam perjalanan ke alamat tujuan
    DELIVERING --> COMPLETED : Makanan sampai & diterima pelanggan
    
    PENDING --> CANCELLED : Dibatalkan sebelum dimasak
    CONFIRMED --> CANCELLED : Dibatalkan oleh merchant/sistem
    CANCELLED --> [*]
    COMPLETED --> [*]
```

---

## 4. Alur Pelacakan Real-time (Socket.io Rooms & Driver Simulation)

Tanpa WebSocket, aplikasi harus melakukan polling API terus menerus (boros bandwidth dan baterai). Dengan **Socket.io Rooms**, update lokasi kurir hanya dikirimkan ke pelanggan yang memesan pesanan tersebut.

```mermaid
sequenceDiagram
    autonumber
    actor Driver as Kurir / Simulator
    actor Customer as Pelanggan
    participant TrackingScreen as OrderTrackingScreen
    participant SocketServer as Backend Socket.io
    participant DriverScreen as DriverSimulatorScreen

    Customer->>TrackingScreen: Buka layar Order Tracking (orderId: "123")
    TrackingScreen->>SocketServer: emit('join-order', "123")
    SocketServer->>SocketServer: socket.join('order:123')
    Note over SocketServer: Client bergabung ke room khusus pesanan #123

    Driver->>DriverScreen: Input koordinat / Klik Preset Rute
    Driver->>DriverScreen: Klik "Kirim Lokasi" / "Jalankan Rute Otomatis"
    DriverScreen->>SocketServer: emit('driver-location', { orderId: "123", latitude, longitude })

    SocketServer->>SocketServer: Cari room 'order:123'
    SocketServer-->>TrackingScreen: io.to('order:123').emit('location-updated', { lat, lng })
    TrackingScreen->>TrackingScreen: Update posisi kurir di peta & UI secara instan!
```

### Keunggulan Desain Ini:
1. **Targeted Delivery**: Koordinat driver pesanan A tidak akan bocor ke pelanggan pesanan B karena dipisahkan oleh *Room Key* (`order:${orderId}`).
2. **Instant Feedback**: Pelanggan melihat motor driver bergerak tanpa jeda polling.
3. **Resilient**: Jika koneksi terputus sesaat, Socket.io secara otomatis menyambung kembali (*auto-reconnect*).
