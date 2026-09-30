# 🔄 02. Alur & Flow Aplikasi (End-to-End)

Dokumen ini menjelaskan alur bisnis dan teknis dari saat pengguna membuka aplikasi, memilih makanan, melakukan pembayaran lewat simulator, menerima notifikasi push, hingga pesanan diantar oleh kurir secara *real-time*.

---

## 1. Alur Autentikasi & Registrasi Device Token (JWT + Push Notification)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Pengguna
    participant Mobile as Mobile App (AuthContext + NotificationSync)
    participant Storage as AsyncStorage
    participant API as Express API (/api/auth & /api/devices)
    participant ExpoPush as Expo Push Gateway
    participant DB as PostgreSQL

    alt Pengguna Login
        Customer->>Mobile: Input Email & Password
        Mobile->>API: POST /api/auth/login {email, password}
        API->>DB: Cari user berdasarkan email & cek passwordHash
        API-->>Mobile: Response { token, user }
        Mobile->>Storage: Simpan 'auth_token' & 'auth_user'
        Mobile->>Mobile: Update AuthContext state
    end

    alt Registrasi Device Token Otomatis
        Mobile->>Mobile: expo-notifications.getPermissionsAsync()
        Mobile->>ExpoPush: expo-notifications.getExpoPushTokenAsync()
        ExpoPush-->>Mobile: Kembalikan ExponentPushToken[...]
        Mobile->>API: POST /api/devices { token, platform: 'mobile' } (Header: Bearer Token)
        API->>DB: prisma.deviceToken.upsert({ where: { token }, create: {...}, update: {...} })
        DB-->>API: Record DeviceToken tersimpan
        API-->>Mobile: 200 OK { success: true }
    end
```

---

## 2. Alur Pemesanan & Pembayaran (Checkout -> Payment Simulator)

Strategi state management memisahkan keranjang belanja lokal dengan alur transaksi pemesanan dan pembayaran:
- **`CartContext`**: Mengelola item yang ditambah/dikurangi di layar restoran dan menyediakan fungsi `clearCart()`.
- **`Redux orderSlice`**: Mengatur status checkout (`idle` ➔ `loading` ➔ `success` / `failed`) serta menyimpan `orderId` yang dihasilkan.
- **`Payment Simulator`**: Mensimulasikan hasil pembayaran (`PAID` atau `FAILED`) secara instan tanpa gateway eksternal sungguhan.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Pengguna
    participant Checkout as CheckoutScreen
    participant Redux as Redux orderSlice
    participant Cart as CartContext
    participant API as Express API (/api/orders & /api/payments)
    participant NotifSvc as Backend Notification Service
    participant ExpoPush as Expo Push Gateway
    participant DB as PostgreSQL

    Customer->>Checkout: Pilih Metode Pembayaran (misal: QRIS) & Klik "Lanjut ke Pembayaran"
    Checkout->>Redux: dispatch(setStatus('loading'))
    
    Note over Checkout,API: 1. Buat Record Order
    Checkout->>API: POST /api/orders (Body: items[])
    API->>DB: prisma.order.create (status: PENDING, totalPrice)
    DB-->>API: Record Order baru + ID

    Note over Checkout,API: 2. Buat Record Payment
    Checkout->>API: POST /api/payments (Body: { orderId, method })
    API->>DB: prisma.payment.create (status: PENDING, amount)
    DB-->>API: Record Payment baru + ID
    API-->>Checkout: 201 Created { data: payment }
    Checkout->>Redux: dispatch(setStatus('success'))
    Checkout->>Checkout: Buka Modal Payment Simulator

    Note over Customer,DB: 3. Simulasi Pembayaran
    Customer->>Checkout: Klik "Simulasi Berhasil (PAID)"
    Checkout->>API: POST /api/payments/simulate { paymentId, status: 'PAID' }
    API->>DB: prisma.payment.update (status: PAID)
    API->>DB: prisma.order.update (status: CONFIRMED)
    
    Note over API,ExpoPush: 4. Memicu Push Notification
    API->>NotifSvc: Kirim notifikasi 'PAYMENT_SUCCESS' ke userId
    NotifSvc->>DB: Ambil semua deviceToken user
    NotifSvc->>ExpoPush: POST /--/api/v2/push/send { title: "Pembayaran Berhasil", ... }
    
    API-->>Checkout: 200 OK { success: true, data: payment, order }
    Checkout->>Cart: clearCart()
    Checkout->>Customer: Alert Berhasil -> Opsi "Lacak Pesanan"
```

---

## 3. Siklus Hidup Status Pesanan & Pembayaran (State Machine)

Setiap pesanan di sistem mengikuti alur status yang saling terhubung dengan status pembayaran:

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT : User checkout pesanan
    
    PENDING_PAYMENT --> ORDER_CONFIRMED : Payment status: PAID
    PENDING_PAYMENT --> PAYMENT_FAILED : Payment status: FAILED / EXPIRED
    
    ORDER_CONFIRMED --> PREPARING : Restoran mulai memasak
    PREPARING --> READY : Makanan selesai dikemas
    READY --> PICKED_UP : Driver mengambil pesanan
    PICKED_UP --> DELIVERING : Driver dalam perjalanan ke alamat
    DELIVERING --> COMPLETED : Makanan sampai di tangan pelanggan
    
    PAYMENT_FAILED --> [*] : Pesanan gagal
    COMPLETED --> [*] : Pesanan sukses
```

---

## 4. Alur Pelacakan Real-time (Socket.io Rooms & Driver Simulation)

Dengan **Socket.io Rooms**, update lokasi kurir hanya dikirimkan ke pelanggan yang memesan pesanan terkait secara *targeted* tanpa polling API:

```mermaid
sequenceDiagram
    autonumber
    actor Driver as Kurir / DriverSimulatorScreen
    actor Customer as Pelanggan / OrderTrackingScreen
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

    SocketServer->>SocketServer: Broadcast ke room 'order:123'
    SocketServer-->>TrackingScreen: io.to('order:123').emit('location-updated', { lat, lng })
    TrackingScreen->>TrackingScreen: Update posisi motor kurir di peta seketika!
```

---

## 5. Alur Unit Testing (Quality Assurance)

Untuk memastikan keandalan kalkulasi transaksi sebelum kode dirilis ke tahap produksi:
```mermaid
graph LR
    INPUT["Array Items [{ price: 10000, qty: 2 }, { price: 5000, qty: 1 }]"]
    FN["calculateTotal(items)"]
    ASSERT["expect(total).toBe(25000)"]
    EMPTY["Array Kosong []"]
    ASSERT_EMPTY["expect(total).toBe(0)"]

    INPUT --> FN --> ASSERT
    EMPTY --> FN --> ASSERT_EMPTY
```
- Menjamin tidak ada *regression error* saat dilakukan perubahan struktur kode.
- Dapat diuji secara otomatis di terminal atau CI/CD pipeline menggunakan perintah `npm test`.
