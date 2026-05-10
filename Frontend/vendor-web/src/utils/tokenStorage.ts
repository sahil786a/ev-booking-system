const TOKEN_KEY = 'ev_vendor_token';
const VENDOR_KEY = 'ev_vendor_data';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VENDOR_KEY);
};

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
