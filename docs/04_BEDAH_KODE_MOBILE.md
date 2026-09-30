# 📱 04. Bedah Kode Mobile (Deep-Dive)

Dokumen ini membedah arsitektur dan implementasi kode pada direktori [`mobile/`](file:///Users/sulaimansaleh/Documents/uob-fullstack-mobile/gofood-clone-day1/mobile) hingga penambahan fitur Day 3 (Push Notification, Payment Simulator, FlatList, dan Sinkronisasi Token).

---

## 1. Struktur Direktori Mobile

```text
mobile/
├── src/
│   ├── components/
│   │   ├── SearchBar.tsx           # Kotak pencarian visual di Home
│   │   ├── CategoryItem.tsx        # Tombol pill kategori makanan
│   │   ├── RestaurantCard.tsx      # Komponen kartu informasi restoran
│   │   └── TrackingMap.tsx         # WebView peta interaktif Leaflet + OpenStreetMap
│   ├── context/
│   │   ├── AuthContext.tsx         # Manajemen sesi login & AsyncStorage
│   │   └── CartContext.tsx         # Manajemen keranjang belanja & fungsi clearCart
│   ├── navigation/
│   │   └── AppNavigator.tsx        # React Navigation Native Stack
│   ├── screens/
│   │   ├── LoginScreen.tsx         # Layar login dengan tombol demo
│   │   ├── RegisterScreen.tsx      # Layar pendaftaran akun baru
│   │   ├── HomeScreen.tsx          # Layar beranda katalog makanan
│   │   ├── RestaurantDetailScreen.tsx # Layar detail restoran & daftar menu
│   │   ├── CheckoutScreen.tsx      # Layar checkout & Interactive Payment Simulator Modal
│   │   ├── OrderHistoryScreen.tsx  # Layar riwayat pesanan (FlatList berkinerja tinggi)
│   │   ├── OrderTrackingScreen.tsx # Layar pelacakan kurir real-time (Socket.io)
│   │   └── DriverSimulatorScreen.tsx # Layar simulator pergerakan driver di peta
│   ├── services/
│   │   ├── api.ts                  # Axios client terpusat + Request/Response Interceptor
│   │   ├── orderApi.ts             # API helper untuk membuat & mengambil pesanan
│   │   ├── socket.ts               # Socket.io client instance
│   │   ├── notification.ts         # Service registrasi Expo Push Notification & foreground handler
│   │   ├── deviceApi.ts            # API helper pendaftaran device token ke server
│   │   └── paymentApi.ts           # API helper createPayment & simulatePayment
│   └── store/
│       ├── orderSlice.ts           # Redux Toolkit slice untuk status checkout
│       └── store.ts                # Konfigurasi Redux Store
├── App.tsx                         # Entry point aplikasi + Sinkronisasi push token
├── package.json
└── .env
```

---

## 2. Bedah Komponen & Modul Penting

### A. Sinkronisasi Push Token di `App.tsx` (Slide 10 & 18)
Komponen `NotificationSync` memastikan bahwa ketika token Expo Push diperoleh dari perangkat, token tersebut otomatis didaftarkan dan dikaitkan dengan user yang sedang login di server:

```typescript
function NotificationSync() {
  const { token: authToken } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    registerForPushNotifications().then((token) => {
      if (token) {
        setPushToken(token);
        registerDevice(token).catch(() => {});
      }
    });
  }, []);

  useEffect(() => {
    if (pushToken && authToken) {
      registerDevice(pushToken).catch((err) =>
        console.warn('Gagal sinkronisasi token dengan user:', err.message)
      );
    }
  }, [pushToken, authToken]);

  return null;
}
```

---

### B. `src/services/notification.ts` (Slide 9)
Mengatur izin notifikasi, membuat saluran Android, dan mengonfigurasi handler notifikasi foreground:

```typescript
// Notifikasi tetap muncul saat aplikasi sedang aktif di layar (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00AA13',
    });
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync();
  return tokenResponse.data;
}
```

---

### C. `src/screens/CheckoutScreen.tsx` — Payment Simulator (Slide 22, 27, 29, 30)
Layar checkout telah dilengkapi dengan:
1. **Pemilih Metode Pembayaran**: QRIS, GoPay, Virtual Account, Tunai.
2. **Interactive Modal Simulator**:
   - Memanggil `createOrder(payload)` dan `createPayment(orderId, method)`.
   - Menampilkan modal popup status `PENDING` dengan nominal dan rincian transaksi.
   - Tombol **"Simulasi Berhasil (PAID)"** ➔ memanggil `simulatePayment(id, 'PAID')`, mengosongkan keranjang belanja (`clearCart()`), memunculkan alert sukses, dan tombol langsung ke pelacakan kurir (`OrderTracking`).
   - Tombol **"Simulasi Gagal (FAILED)"** ➔ mensimulasikan penolakan pembayaran.

---

### D. Optimasi FlatList di `OrderHistoryScreen.tsx` (Slide 48)
Alih-alih menggunakan `.map()` di dalam `ScrollView` yang memuat seluruh DOM sekaligus, riwayat pesanan menggunakan `FlatList`:
- Komponen hanya merender elemen yang tampak di layar (*windowing / virtualization*).
- Menghemat memori HP dan memastikan scroll mulus (*60 FPS*) meski terdapat ratusan transaksi.
- Menampilkan indikator status pesanan dan rincian pembayaran (`PAID` / `PENDING`).

---

### E. Axios Response Interceptor di `src/services/api.ts` (Slide 43)
Mendeteksi kegagalan API secara terpusat untuk mempermudah debugging:

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    console.warn(`❌ [API Error] Status: ${status || 'NETWORK_ERROR'}`);
    if (status === 401) {
      console.warn('👉 Request ditolak 401 Unauthorized! Periksa token di AsyncStorage.');
    }
    return Promise.reject(error);
  }
);
```
