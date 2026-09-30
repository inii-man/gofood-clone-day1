import { Platform, LogBox } from 'react-native';
import Constants from 'expo-constants';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'shouldShowAlert is deprecated',
  'No "projectId" found',
]);

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  (Constants as any).executionEnvironment === 'storeClient';
const isAndroidExpoGo = Platform.OS === 'android' && isExpoGo;

// Lazy load expo-notifications hanya jika BUKAN Android Expo Go
// Hal ini mencegah fatal Error / warning SDK 53 yang dilempar expo-notifications di Expo Go Android.
let Notifications: any = null;
if (!isAndroidExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e: any) {
    console.log('[PUSH] expo-notifications loader non-critical:', e?.message);
  }
}

// Event system untuk In-App Notification Banner yang bekerja 100% mulus di semua perangkat
type NotificationListener = (payload: { title: string; body: string; data?: Record<string, any> }) => void;
const listeners = new Set<NotificationListener>();

export function onLocalNotification(callback: NotificationListener) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // 1. Jika di Android Expo Go, langsung kembalikan token simulasi tanpa menyentuh modul native FCM
    if (isAndroidExpoGo) {
      console.log(
        '📱 [PUSH NOTIFICATION] Berjalan di Expo Go Android (SDK 53+). Menggunakan token simulasi & In-App Notification.'
      );
      const simulatedToken = `SimulatedDevice-android-${Math.random().toString(36).substring(2, 9)}`;
      return simulatedToken;
    }

    // 2. Request permissions jika di lingkungan yang didukung (iOS atau Development Build)
    if (Notifications) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ [PUSH NOTIFICATION] Izin notifikasi tidak diberikan oleh pengguna.');
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00AA13',
          sound: 'default',
        });
      }

      const tokenResponse = await Notifications.getExpoPushTokenAsync();
      const token = tokenResponse.data;
      console.log('📱 [PUSH NOTIFICATION] Expo Push Token didapat:', token);
      return token;
    }

    return `SimulatedDevice-${Platform.OS}-${Math.random().toString(36).substring(2, 9)}`;
  } catch (error: any) {
    console.warn('⚠️ [PUSH NOTIFICATION] Fallback to simulated token:', error.message || error);
    return `SimulatedDevice-${Platform.OS}-fallback`;
  }
}

/**
 * Memunculkan notifikasi di perangkat:
 * 1. Menampilkan In-App Floating Notification Banner di layar (seperti Gojek sungguhan).
 * 2. Memanggil system notification native jika didukung oleh platform.
 */
export async function showLocalNotification(title: string, body: string, data?: Record<string, any>) {
  console.log(`🔔 [NOTIFICATION] "${title}" - "${body}"`);

  // 1. Selalu tampilkan floating banner di dalam aplikasi
  listeners.forEach((listener) => {
    try {
      listener({ title, body, data });
    } catch (err) {
      console.error('Error in notification listener:', err);
    }
  });

  // 2. Jadwalkan juga ke system tray jika library Notifications tersedia
  if (Notifications?.scheduleNotificationAsync) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          data: data || {},
        },
        trigger: null,
      });
    } catch (error: any) {
      console.log('OS scheduleNotificationAsync non-critical:', error?.message);
    }
  }
}
