import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/store/store';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotifications } from './src/services/notification';
import { registerDevice } from './src/services/deviceApi';

function NotificationSync() {
  const { token: authToken } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    registerForPushNotifications().then((token) => {
      console.log('Push Token:', token);
      if (token) {
        setPushToken(token);
        // Slide 18: Setelah token didapat dan tidak null, panggil registerDevice(token)
        registerDevice(token).catch((err) => {
          // Jika belum login, akan diregister kembali begitu authToken tersedia
          console.log('[PUSH] Register token awal (sebelum auth atau guest):', err?.response?.status || err.message);
        });
      }
    });
  }, []);

  useEffect(() => {
    if (pushToken && authToken) {
      registerDevice(pushToken)
        .then(() => console.log('✅ [PUSH] Device token berhasil terdaftar untuk user yang sedang aktif.'))
        .catch((err) => console.warn('⚠️ [PUSH] Gagal sinkronisasi token dengan user:', err.message));
    }
  }, [pushToken, authToken]);

  return null;
}

export default function App() {
  return (
    <ReduxProvider store={store}>
      <AuthProvider>
        <CartProvider>
          <NotificationSync />
          <StatusBar style="dark" />
          <AppNavigator />
        </CartProvider>
      </AuthProvider>
    </ReduxProvider>
  );
}
