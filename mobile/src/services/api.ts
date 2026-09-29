import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'http://192.168.88.7:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`[API ➡️] ${config.method?.toUpperCase()} ${config.url} | Token: Bearer ${token.slice(0, 10)}...`);
      } else {
        console.log(`[API ➡️] ${config.method?.toUpperCase()} ${config.url} | Token: ⚠️ NO_TOKEN_IN_ASYNC_STORAGE`);
      }
    } catch (err) {
      console.error('[API] Error reading auth_token from AsyncStorage', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log(`[API ⬅️] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (Success)`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    const serverMsg = error.response?.data?.message;

    console.warn(`❌ [API Error] ${method} ${url} -> Status: ${status || 'NETWORK_ERROR'}`);
    if (serverMsg) {
      console.warn(`   Server Message: "${serverMsg}"`);
    } else {
      console.warn(`   Error Details:`, error.message);
    }

    if (status === 401) {
      console.warn(`   👉 HINT: Request ditolak 401 Unauthorized! Periksa apakah token di AsyncStorage sudah tersimpan atau token sudah expired.`);
    }

    return Promise.reject(error);
  }
);

export const getRestaurants = () =>
  api.get('/restaurants');

export const getRestaurant = (id: string) =>
  api.get(`/restaurants/${id}`);

export const getMenu = (id: string) =>
  api.get(`/restaurants/${id}/menu`);
