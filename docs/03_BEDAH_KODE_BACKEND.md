# 💻 03. Bedah Kode Backend (Deep-Dive)

Dokumen ini membedah struktur dan implementasi kode pada direktori [`backend/`](file:///Users/sulaimansaleh/Documents/uob-fullstack-mobile/gofood-clone-day1/backend).

---

## 1. Struktur Direktori Backend

```text
backend/
├── prisma/
│   ├── schema.prisma         # Definisi model data & konfigurasi database
│   └── seed.ts               # Data awal untuk testing (restoran & menu)
├── src/
│   ├── controllers/
│   │   ├── authController.ts       # Logika register & login
│   │   ├── orderController.ts      # Logika pembuatan & riwayat order
│   │   └── restaurantController.ts # Logika katalog restoran & menu
│   ├── middleware/
│   │   └── authMiddleware.ts       # Verifikasi token JWT Bearer
│   ├── prisma/
│   │   └── client.ts               # Instance PrismaClient singleton
│   ├── routes/
│   │   ├── authRoutes.ts           # Endpoint /api/auth/*
│   │   ├── orderRoutes.ts          # Endpoint /api/orders/*
│   │   └── restaurantRoutes.ts     # Endpoint /api/restaurants/*
│   └── server.ts                   # Inisialisasi Express & Socket.io server
├── .env                            # Kredensial DB & secret JWT
├── package.json
└── tsconfig.json
```

---

## 2. Bedah File Penting

### A. `prisma/schema.prisma`
File ini mendefinisikan skema tabel di PostgreSQL:
- **`User`**: Menyimpan email unik, kata sandi terenkripsi (`passwordHash`), dan peranan pengguna (`CUSTOMER` / `DRIVER` / `ADMIN`).
- **`Order`**: Menyimpan referensi `userId`, total pembayaran `totalPrice`, status pesanan `status` (default: `"PENDING"`), dan relasi ke `items: OrderItem[]`.
- **`OrderItem`**: Menyimpan rincian setiap item menu yang dibeli (`menuItemId`, `quantity`, `price`), terhubung ke `Order` dan `MenuItem`.

```prisma
model Order {
  id         String      @id @default(uuid())
  userId     String
  status     String      @default("PENDING")
  totalPrice Int
  createdAt  DateTime    @default(now())

  user       User        @relation(fields: [userId], references: [id])
  items      OrderItem[]
}
```

---

### B. `src/server.ts`
File utama yang menggabungkan server HTTP Express dengan WebSocket Socket.io:

```typescript
// Menggabungkan Express App ke dalam Node HTTP Server
const httpServer = createServer(app);

// Inisialisasi Socket.io pada HTTP Server dengan konfigurasi CORS terbuka
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  // Event saat customer membuka layar tracking:
  socket.on('join-order', (orderId: string) => {
    socket.join(`order:${orderId}`);
  });

  // Event saat driver mengirimkan update koordinat:
  socket.on('driver-location', (data: { orderId: string; latitude: number; longitude: number }) => {
    const { orderId, latitude, longitude } = data;
    // Broadcast lokasi hanya ke room pesanan yang bersangkutan
    io.to(`order:${orderId}`).emit('location-updated', { latitude, longitude });
  });
});

// Menjalankan server pada interface '0.0.0.0' agar dapat diakses oleh perangkat mobile di LAN
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`GoFood API & Socket server running on http://0.0.0.0:${PORT}`);
});
```

> **Catatan Penting**: Penggunaan `0.0.0.0` sebagai host binding sangat krusial agar perangkat fisik / emulator Expo dapat terhubung melalui alamat IP lokal (misal: `192.168.x.x`), tidak hanya dari `localhost`.

---

### C. `src/controllers/authController.ts`
1. **`register`**:
   - Memeriksa apakah email sudah terdaftar (`prisma.user.findUnique`).
   - Melakukan hash pada password plain text menggunakan `bcrypt.hash(password, 10)` (10 salt rounds).
   - Menyimpan user baru ke database dan mengembalikan profil tanpa membocorkan hash password.
2. **`login`**:
   - Mencari user berdasarkan email.
   - Memverifikasi kecocokan password menggunakan `bcrypt.compare(password, user.passwordHash)`.
   - Jika valid, menandatangani token JWT menggunakan `jwt.sign()` dengan payload `{ userId, role }` dan masa berlaku 1 hari (`expiresIn: '1d'`).

---

### D. `src/middleware/authMiddleware.ts`
Middleware untuk memproteksi endpoint privat:
```typescript
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.substring(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as AuthRequest['user'];
    next(); // Lanjut ke controller jika token valid
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

---

### E. `src/controllers/orderController.ts`
1. **`createOrder`**:
   - Mengambil `userId` dari `req.user.userId` yang telah didekode oleh middleware autentikasi.
   - Menghitung ulang total harga secara otomatis di sisi backend untuk mencegah manipulasi client:
     ```typescript
     const totalPrice = items.reduce((total, item) => total + item.price * (item.quantity || 1), 0);
     ```
   - Menggunakan Prisma nested writes untuk membuat record `Order` sekaligus `OrderItem[]` dalam satu transaksi atomik database:
     ```typescript
     const order = await prisma.order.create({
       data: {
         userId,
         totalPrice,
         items: {
           create: items.map((item: any) => ({
             menuItemId: item.menuItemId || item.id,
             quantity: item.quantity || 1,
             price: item.price,
           })),
         },
       },
       include: { items: { include: { menuItem: true } } },
     });
     ```
2. **`getMyOrders`**:
   - Mengambil semua pesanan milik user yang sedang aktif (`where: { userId }`), diurutkan dari yang terbaru (`orderBy: { createdAt: 'desc' }`).
