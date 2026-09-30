import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set notification handler so notifications display banner and sound while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // 1. Request notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ [PUSH NOTIFICATION] Izin notifikasi tidak diberikan oleh pengguna.');
    }

    // 2. Configure Android channel if on Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00AA13',
        sound: 'default',
      });
    }

    // 3. Try to get Expo remote push token
    let token: string | null = null;
    try {
      const tokenResponse = await Notifications.getExpoPushTokenAsync();
      token = tokenResponse.data;
      console.log('📱 [PUSH NOTIFICATION] Expo Push Token didapat:', token);
    } catch (pushErr: any) {
      // Pada simulator atau tanpa EAS projectId, getExpoPushTokenAsync akan throw.
      // Kita fallback ke simulated token agar device tetap tercatat di PostgreSQL backend.
      console.log('ℹ️ [PUSH NOTIFICATION] Remote push token belum aktif di environment ini:', pushErr.message);
      token = `SimulatedDevice-${Platform.OS}-${Math.random().toString(36).substring(2, 9)}`;
      console.log('📱 [PUSH NOTIFICATION] Menggunakan device token simulasi:', token);
    }

    return token;
  } catch (error: any) {
    console.warn('⚠️ [PUSH NOTIFICATION] Error in registerForPushNotifications:', error.message || error);
    return `SimulatedDevice-${Platform.OS}-fallback`;
  }
}

/**
 * Memunculkan banner notifikasi sistem lokal di perangkat (bekerja 100% di HP fisik maupun simulator!)
 */
export async function showLocalNotification(title: string, body: string, data?: Record<string, any>) {
  try {
    console.log(`🔔 [LOCAL NOTIF] Memunculkan notifikasi sistem: "${title}" - "${body}"`);
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: data || {},
      },
      trigger: null, // langsung muncul sekarang (0 ms)
    });
  } catch (error: any) {
    console.error('💥 [LOCAL NOTIF] Gagal memunculkan notifikasi:', error);
  }
}
