import React, { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/store/store';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import InAppNotificationBanner from './src/components/InAppNotificationBanner';
import { registerForPushNotifications } from './src/services/notification';
import { registerDevice } from './src/services/deviceApi';

// Abaikan warning bawaan Expo Go Android SDK 53 agar tidak memunculkan banner kuning/merah di layar
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
  '[expo-notifications]: `shouldShowAlert` is deprecated',
  'No "projectId" found',
]);


function NotificationSync() {
  const { token: authToken } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    registerForPushNotifications()
      .then((token) => {
        console.log('Push Token:', token);
        if (token) {
          setPushToken(token);
          // Slide 18: Setelah token didapat dan tidak null, panggil registerDevice(token)
          registerDevice(token).catch((err) => {
            // Jika belum login, akan diregister kembali begitu authToken tersedia
            console.log('[PUSH] Register token awal (sebelum auth atau guest):', err?.response?.status || err.message);
          });
        }
      })
      .catch((err) => {
        console.warn('⚠️ [PUSH] Register push notifications error:', err);
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
          <InAppNotificationBanner />
        </CartProvider>
      </AuthProvider>
    </ReduxProvider>
  );
}
