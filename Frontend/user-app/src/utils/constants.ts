export const STORAGE_KEYS = {
  USER_TOKEN: 'ev_user_app_token',
};

export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!raw) {
    console.warn('[config] EXPO_PUBLIC_API_BASE_URL is not set — defaulting to http://localhost:5000');
    return 'http://localhost:5000';
  }
  return raw.replace(/\/$/, '');
}
