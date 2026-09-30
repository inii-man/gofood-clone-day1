import { api } from './api';

export interface PaymentData {
  id: string;
  orderId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  method: string;
  transactionId?: string;
  createdAt: string;
}

export const createPayment = async (orderId: string, method: string = 'QRIS') => {
  const response = await api.post('/payments', { orderId, method });
  return response.data;
};

export const simulatePayment = async (paymentId: string, status: 'PAID' | 'FAILED' | 'EXPIRED') => {
  const response = await api.post('/payments/simulate', { paymentId, status });
  return response.data;
};

export const getPaymentByOrderId = async (orderId: string) => {
  const response = await api.get(`/payments/order/${orderId}`);
  return response.data;
};
