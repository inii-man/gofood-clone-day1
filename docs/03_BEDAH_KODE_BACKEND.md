# 💻 03. Bedah Kode Backend (Deep-Dive)

Dokumen ini membedah struktur dan implementasi kode pada direktori [`backend/`](file:///Users/sulaimansaleh/Documents/uob-fullstack-mobile/gofood-clone-day1/backend) hingga implementasi modul Day 3 (Push Notification, Payment Simulator, Unit Testing, dan Paginasi DB).

---

## 1. Struktur Direktori Backend

```text
backend/
├── prisma/
│   ├── schema.prisma             # Definisi skema PostgreSQL (User, Order, Payment, DeviceToken, dll)
│   └── seed.ts                   # Data awal untuk testing (restoran, menu, dan demo user)
├── src/
│   ├── controllers/
│   │   ├── authController.ts       # Logika registrasi & login JWT
│   │   ├── orderController.ts      # Pembuatan order & riwayat pesanan (support paginasi DB)
│   │   ├── restaurantController.ts # Katalog restoran & menu
│   │   ├── deviceController.ts     # Pendaftaran device token push notification (upsert)
│   │   └── paymentController.ts    # Transaksi payment & payment simulator (PAID / FAILED)
│   ├── middleware/
│   │   └── authMiddleware.ts       # Verifikasi token JWT Bearer & pengecekan role
│   ├── prisma/
│   │   └── client.ts               # Instance PrismaClient singleton
│   ├── routes/
│   │   ├── authRoutes.ts           # Endpoint /api/auth/*
│   │   ├── orderRoutes.ts          # Endpoint /api/orders/*
│   │   ├── restaurantRoutes.ts     # Endpoint /api/restaurants/*
│   │   ├── deviceRoutes.ts         # Endpoint /api/devices/*
│   │   └── paymentRoutes.ts        # Endpoint /api/payments/*
│   ├── services/
│   │   └── notificationService.ts  # Dispatcher push notification ke Expo Push Gateway
│   ├── utils/
│   │   ├── calculateTotal.ts       # Pure function penghitung subtotal belanja
│   │   └── calculateTotal.test.ts  # Unit test Jest (happy path & negative case)
│   └── server.ts                   # Inisialisasi Express, Middleware logger, Socket.io, & Health check
├── jest.config.js                # Konfigurasi Jest runner
├── tsconfig.json                 # Konfigurasi TypeScript compiler
├── package.json
└── .env
```

---

## 2. Bedah File & Modul Penting

### A. `prisma/schema.prisma`
Model basis data PostgreSQL mencakup entitas lengkap:
- **`DeviceToken`**: Menyimpan token perangkat unik (`token @unique`) yang berelasi ke `User` lewat `userId`.
- **`Payment`**: Menyimpan data pembayaran 1-ke-1 dengan `Order` (`orderId @unique`), status (`PENDING`, `PAID`, `FAILED`), dan metode bayar (`QRIS`, `GOPAY`, dll).
- **`Order`**: Menyimpan relasi `items: OrderItem[]` dan `payment: Payment?`.

```prisma
model DeviceToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  platform  String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model Payment {
  id            String   @id @default(uuid())
  orderId       String   @unique
  amount        Int
  status        String   @default("PENDING")
  method        String
  transactionId String?
  createdAt     DateTime @default(now())
  order         Order    @relation(fields: [orderId], references: [id])
}
```

---

### B. `src/controllers/deviceController.ts` (Slide 15)
Menangani penyimpanan token perangkat push notification. Menggunakan metode `upsert` agar token yang sama tidak terduplikasi:

```typescript
export const registerDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { token, platform } = req.body;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const device = await prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform: platform || 'mobile' },
      create: { token, platform: platform || 'mobile', userId },
    });

    res.json({ success: true, data: device });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to register device' });
  }
};
```

---

### C. `src/controllers/paymentController.ts` (Slide 26, 27, 31, 32)
Menangani inisiasi pembayaran dan simulator:
1. **`createPayment`**: Membuat record payment berstatus `PENDING` dengan nominal sesuai `order.totalPrice`.
2. **`simulatePayment`**: 
   - Mengupdate status payment menjadi `PAID` atau `FAILED`.
   - Mengupdate status pesanan (`status === 'PAID' ? 'CONFIRMED' : 'PAYMENT_FAILED'`).
   - Memicu notifikasi push ke perangkat pengguna jika pembayaran berhasil (`PAID`).

```typescript
export const simulatePayment = async (req: AuthRequest, res: Response) => {
  const { paymentId, status } = req.body; // 'PAID' | 'FAILED'
  
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { status },
  });

  const order = await prisma.order.update({
    where: { id: payment.orderId },
    data: { status: status === 'PAID' ? 'CONFIRMED' : 'PAYMENT_FAILED' },
  });

  // Kirim notifikasi push bila pembayaran lunas (Slide 32-33)
  if (status === 'PAID') {
    await sendNotificationToUser(order.userId, {
      title: 'Pembayaran Berhasil',
      body: `Pesanan #${order.id.slice(0, 8)} sudah dikonfirmasi.`,
      data: { orderId: order.id, status: 'CONFIRMED' },
    });
  }

  res.json({ success: true, data: payment, order });
};
```

---

### D. `src/services/notificationService.ts` (Slide 19 & 20)
Bertugas mengumpulkan token milik user dan mengirimkan HTTP request ke Expo Push Gateway:

```typescript
export async function getUserTokens(userId: string) {
  const devices = await prisma.deviceToken.findMany({ where: { userId } });
  return devices.map((d) => d.token);
}

export async function sendNotificationToUser(userId: string, payload: NotificationPayload) {
  const tokens = await getUserTokens(userId);
  if (tokens.length === 0) return;

  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
  }));

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
}
```

---

### E. Optimasi Paginasi Database di `orderController.ts` (Slide 46 & 47)
Agar server tidak lambat saat user memiliki ratusan pesanan, query riwayat pesanan dioptimasi dengan klausa `skip` dan `take`:

```typescript
const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
const limit = req.query.limit ? Math.max(1, Number(req.query.limit)) : 20;
const skip = (page - 1) * limit;

const orders = await prisma.order.findMany({
  where: { userId },
  include: {
    items: { include: { menuItem: true } },
    payment: true,
  },
  orderBy: { createdAt: 'desc' },
  skip,
  take: limit,
});
```

---

### F. Unit Testing: `calculateTotal.ts` & `calculateTotal.test.ts` (Slide 35–37)
Pengujian otomatis menggunakan Jest:

```typescript
// calculateTotal.ts
export const calculateTotal = (items: { price: number; quantity: number }[]) =>
  items.reduce((total, item) => total + item.price * item.quantity, 0);

// calculateTotal.test.ts
describe('calculateTotal', () => {
  it('calculates order total', () => {
    const items = [
      { price: 10000, quantity: 2 },
      { price: 5000, quantity: 1 },
    ];
    expect(calculateTotal(items)).toBe(25000);
  });

  it('returns zero for empty cart', () => {
    expect(calculateTotal([])).toBe(0);
  });
});
```
Dijalankan dengan perintah: `npm test`.
