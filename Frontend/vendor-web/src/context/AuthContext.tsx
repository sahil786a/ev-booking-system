import React, { createContext, useCallback, useEffect, useState } from 'react';
import { authApi } from '@/api/authApi';
import {
  clearTokens,
  getStoredVendor,
  getToken,
  setStoredVendor,
  setTokens,
} from '@/utils/tokenStorage';
import type { AuthState, LoginPayload, RegisterPayload, Vendor } from '@/types';

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    vendor: getStoredVendor<Vendor>(),
    token: getToken(),
    isAuthenticated: !!getToken(),
    isLoading: true,
  });

  // Verify token on mount by fetching profile
  useEffect(() => {
    const verify = async () => {
      const token = getToken();
      if (!token) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }
      try {
        const vendor = await authApi.getProfile();
        setStoredVendor(vendor);
        setState({ vendor, token, isAuthenticated: true, isLoading: false });
      } catch {
        clearTokens();
        setState({ vendor: null, token: null, isAuthenticated: false, isLoading: false });
      }
    };
    verify();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await authApi.login(payload);
    setTokens(res.token, res.refreshToken);
    setStoredVendor(res.vendor);
    setState({ vendor: res.vendor, token: res.token, isAuthenticated: true, isLoading: false });
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    setTokens(res.token, res.refreshToken);
    setStoredVendor(res.vendor);
    setState({ vendor: res.vendor, token: res.token, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setState({ vendor: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  const refreshProfile = useCallback(async () => {
    const vendor = await authApi.getProfile();
    setStoredVendor(vendor);
    setState((prev) => ({ ...prev, vendor }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
