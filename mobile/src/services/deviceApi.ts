import { api } from './api';

export const registerDevice = (token: string) =>
  api.post('/devices', { token, platform: 'mobile' });
