const TOKEN_KEY = 'ev_vendor_token';
const REFRESH_TOKEN_KEY = 'ev_vendor_refresh_token';
const VENDOR_KEY = 'ev_vendor_data';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (token: string, refreshToken?: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(VENDOR_KEY);
};

// Backward compatibility
export const setToken = (token: string): void => setTokens(token);
export const clearToken = (): void => clearTokens();

export const getStoredVendor = <T>(): T | null => {
  try {
    const raw = localStorage.getItem(VENDOR_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const setStoredVendor = <T>(vendor: T): void => {
  localStorage.setItem(VENDOR_KEY, JSON.stringify(vendor));
};
