# 📱 04. Bedah Kode Mobile (Deep-Dive)

Dokumen ini membedah arsitektur dan kode aplikasi mobile pada direktori [`mobile/`](file:///Users/sulaimansaleh/Documents/uob-fullstack-mobile/gofood-clone-day1/mobile).

---

## 1. Struktur Direktori Mobile

```text
mobile/
├── src/
│   ├── components/               # Komponen UI modular (SearchBar, CategoryItem, RestaurantCard, TrackingMap)
│   ├── context/
│   │   ├── AuthContext.tsx       # State sesi login & token (AsyncStorage)
│   │   └── CartContext.tsx       # State keranjang belanja lokal
│   ├── data/
│   │   └── dummy.ts              # Data mockup fallback kategori & menu
│   ├── navigation/
│   │   └── AppNavigator.tsx      # Manajemen router & auth protection stack
│   ├── screens/
│   │   ├── LoginScreen.tsx       # Layar login akun
│   │   ├── RegisterScreen.tsx    # Layar pendaftaran akun baru
│   │   ├── HomeScreen.tsx        # Layar utama (daftar restoran, promo, filter)
│   │   ├── RestaurantDetailScreen.tsx # Daftar menu makanan restoran & tambah keranjang
│   │   ├── CheckoutScreen.tsx    # Ringkasan belanja, Redux sync, & eksekusi order
│   │   ├── OrderHistoryScreen.tsx# Riwayat pesanan pengguna
│   │   ├── OrderTrackingScreen.tsx # Visualisasi pelacakan kurir real-time (Socket.io)
│   │   └── DriverSimulatorScreen.tsx # Simulator pergerakan kurir untuk demo
│   ├── services/
│   │   ├── api.ts                # Konfigurasi Axios & Bearer Token Interceptor
│   │   ├── orderApi.ts           # Service pemanggilan API orders
│   │   └── socket.ts             # Inisialisasi Socket.io client & room joiner
│   ├── store/
│   │   ├── orderSlice.ts         # Redux slice untuk alur pesanan
│   │   └── store.ts              # Konfigurasi Redux Store
│   └── types/
│       └── index.ts              # TypeScript interface definitions
├── App.tsx                       # Root wrapper (Redux + Context + Statusbar)
├── app.json
├── package.json
└── tsconfig.json
```

---

## 2. Bedah Komponen & Layer Utama

### A. Provider Stacking di `App.tsx`
Semua konteks state dibungkus secara hierarkis:
```tsx
export default function App() {
  return (
    <ReduxProvider store={store}>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </CartProvider>
      </AuthProvider>
    </ReduxProvider>
  );
}
```
Hierarki ini memastikan komponen navigasi dan layar memiliki akses serentak ke Redux store (aliran order), Auth context (data user), dan Cart context (keranjang belanja).

---

### B. Proteksi Navigasi di `src/navigation/AppNavigator.tsx`
Navigasi secara otomatis beralih antara **Auth Stack** dan **App Stack** bergantung pada kondisi `user`:
```tsx
const { user, isLoading } = useAuth();

if (isLoading) {
  return <ActivityIndicator size="large" color="#00AA13" />;
}

return (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Hanya bisa diakses saat pengguna BELUM login
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // Hanya bisa diakses saat pengguna SUDAH login
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
          <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
          <Stack.Screen name="DriverSimulator" component={DriverSimulatorScreen} />
        </>
      )}
    </Stack.Navigator>
  </NavigationContainer>
);
```

---

### C. Manajemen Sesi Persisten di `src/context/AuthContext.tsx`
- **Restore Session**: Saat aplikasi dibuka, `useEffect` membaca `auth_token` dan `auth_user` dari `AsyncStorage`. Jika ditemukan, user langsung masuk tanpa perlu login ulang.
- **Login Function**: Menyimpan token ke `AsyncStorage` dan mengupdate state.
- **Logout Function**: Menghapus `auth_token` dan `auth_user` sehingga navigasi otomatis kembali ke layar Login.

---

### D. Axios Request Interceptor di `src/services/api.ts`
Untuk mempermudah pemanggilan endpoint privat, setiap HTTP request secara transparan dicegat untuk menyematkan JWT Token:
```typescript
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### E. Redux Toolkit di `src/store/orderSlice.ts`
Mengatur lifecycle proses checkout:
```typescript
interface OrderState {
  items: any[];
  status: 'idle' | 'loading' | 'success' | 'failed';
  orderId: string | null;
}
```
- `setItems`: Menyimpan daftar item belanja yang akan dicheckout.
- `setStatus`: Melacak status loading API untuk mengatur UI tombol dan animasi.
- `setOrderId`: Menyimpan ID pesanan yang baru saja berhasil dibuat.

---

### F. Real-time Live Tracking di `src/screens/OrderTrackingScreen.tsx`
1. Saat layar dibuka, memanggil `joinOrderRoom(orderId)` untuk bergabung ke room WebSocket pesanan tersebut.
2. Mendengarkan event `location-updated`:
   ```typescript
   useEffect(() => {
     joinOrderRoom(orderId);

     const handleLocationUpdate = (location) => {
       setDriverLocation({
         latitude: location.latitude,
         longitude: location.longitude,
         updatedAt: new Date().toLocaleTimeString(),
       });
     };

     socket.on('location-updated', handleLocationUpdate);
     return () => {
       socket.off('location-updated', handleLocationUpdate);
     };
   }, [orderId]);
   ```
3. Menampilkan visualisasi rute interaktif, rincian koordinat lintang & bujur secara dinamis, kartu profil kurir, dan ringkasan pesanan.

---

### G. Driver Simulator di `src/screens/DriverSimulatorScreen.tsx`
Dirancang khusus untuk demonstrasi dan testing tanpa perlu aplikasi kurir fisik terpisah:
- Pengguna dapat memasukkan `orderId` dan koordinat bebas.
- Terdapat pilihan **Preset Rute** (Restoran ➔ Jl. Sudirman ➔ Semanggi ➔ Tiba di Tujuan).
- Fitur **Jalankan Rute Otomatis (5 Titik)**: Menggunakan interval waktu (setiap 2.5 detik) untuk mengirimkan event `driver-location` bertahap, sehingga pergerakan kurir dapat dilihat langsung di layar pelacakan pelanggan.
