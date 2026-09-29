import { io } from 'socket.io-client';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.88.7:3000/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true,
});

// Function untuk join order room (Slide 53)
export const joinOrderRoom = (orderId: string) => {
  socket.emit('join-order', orderId);
};
