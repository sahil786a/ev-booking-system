import { api } from './client';

export type UserProfile = {
  id?: number | string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
};

type TokenEnvelope = {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  jwt?: string;
  data?: Record<string, unknown>;
};

export function coerceToken(payload: TokenEnvelope): string | null {
  const direct = payload.token ?? payload.accessToken ?? payload.jwt;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  if (payload.data && typeof payload.data === 'object') {
    const nested = payload.data as TokenEnvelope;
    const nestedTok = coerceToken({ ...nested, data: undefined });
    if (nestedTok) return nestedTok;
  }
  return null;
}

function unwrapInner<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    return (raw as { data: T }).data as T;
  }
  return raw as T;
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<{ token: string | null; refreshToken: string | null }> {
  const response = await api.post<UserProfile | TokenEnvelope>('/api/auth/users/register', payload);
  const body = unwrapInner<UserProfile | TokenEnvelope>(response.data);
  const token = coerceToken(body as TokenEnvelope);
  const refreshToken = (body as TokenEnvelope).refreshToken ?? null;
  return { token, refreshToken };
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<{ token: string; refreshToken: string | null; profile?: UserProfile | null }> {
  const response = await api.post<TokenEnvelope>('/api/auth/users/login', payload);
  const body = unwrapInner<TokenEnvelope>(response.data);
  const token = coerceToken(body as TokenEnvelope);
  const refreshToken = body.refreshToken ?? null;
  if (!token) {
    throw new Error('Login response missing token.');
  }
  return { token, refreshToken };
}

export async function fetchProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>('/api/auth/users/profile');
  return unwrapInner<UserProfile>(response.data);
}

export async function refreshToken(token: string): Promise<{ token: string }> {
  const response = await api.post<{ token: string }>('/api/auth/refresh', { refreshToken: token });
  return unwrapInner<{ token: string }>(response.data);
}
