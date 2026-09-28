import axios from 'axios';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'http://YOUR_LOCAL_IP:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      'API Error:',
      error.response?.data || error.message
    );

    return Promise.reject(error);
  }
);

export const getRestaurants = () =>
  api.get('/restaurants');

export const getRestaurant = (id: string) =>
  api.get(`/restaurants/${id}`);

export const getMenu = (id: string) =>
  api.get(`/restaurants/${id}/menu`);
