import client from './client';
import type { AuthResponse, LoginPayload, RegisterPayload, Vendor } from '@/types';

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await client.post<AuthResponse>('/api/auth/vendors/login', payload);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await client.post<AuthResponse>('/api/auth/vendors/register', payload);
    return data;
  },

  getProfile: async (): Promise<Vendor> => {
    const { data } = await client.get<{ vendor: Vendor }>('/api/auth/vendors/profile');
    return data.vendor;
  },

  refresh: async (token: string): Promise<{ token: string }> => {
    const { data } = await client.post<{ token: string }>('/api/auth/refresh', { refreshToken: token });
    return data;
  },
};
