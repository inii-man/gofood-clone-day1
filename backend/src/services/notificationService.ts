import prisma from '../prisma/client';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const NOTIFICATION_EVENTS = {
  ORDER_CREATED: {
    title: 'Pesanan Dibuat',
    body: (orderId: string) => `Pesanan #${orderId.slice(0, 8)} berhasil dibuat. Menunggu pembayaran.`,
  },
  PAYMENT_SUCCESS: {
    title: 'Pembayaran Berhasil',
    body: (orderId: string) => `Pesanan #${orderId.slice(0, 8)} sudah dikonfirmasi.`,
  },
  ORDER_CONFIRMED: {
    title: 'Pesanan Diproses',
    body: () => 'Restaurant sedang menyiapkan pesanan Anda.',
  },
  DRIVER_ASSIGNED: {
    title: 'Driver Ditugaskan',
    body: () => 'Driver menuju ke restoran untuk mengambil pesanan Anda.',
  },
  ORDER_COMPLETED: {
    title: 'Pesanan Selesai',
    body: () => 'Pesanan Anda telah tiba. Selamat menikmati!',
  },
};

export async function getUserTokens(userId: string): Promise<string[]> {
  const devices = await prisma.deviceToken.findMany({ where: { userId } });
  return devices.map((d) => d.token);
}

/**
 * Kirim Push Notification ke semua token terdaftar milik userId via Expo Push API
 */
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload
) {
  try {
    const tokens = await getUserTokens(userId);

    console.log(
      `🔔 [PUSH] Mengirim notifikasi ke userId "${userId}" (${tokens.length} token terdaftar): "${payload.title}"`
    );

    if (tokens.length === 0) {
      console.log(`ℹ️ [PUSH] Tidak ada device token terdaftar untuk userId "${userId}".`);
      return;
    }

    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    }));

    // Kirim pesan ke Expo Push Notification service
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('✅ [PUSH] Hasil pengiriman notifikasi Expo:', result);
    return result;
  } catch (error) {
    console.error('💥 [PUSH] Gagal mengirim push notification:', error);
  }
}
