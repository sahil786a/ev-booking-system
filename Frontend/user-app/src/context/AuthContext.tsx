import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { fetchProfile, loginUser, registerUser, type UserProfile } from '../api/authApi';
import { setUnauthorizedHandler } from '../api/client';
import { navigationRef } from '../navigation/navigationRef';
import { queryClientSingleton } from '../queryClient';
import { triggerSoftRefresh } from '../services/realtimeService';
import { setStoredTokens, getStoredToken, getStoredRefreshToken } from '../services/tokenStorage';

export type AuthState = {
  user: UserProfile | null;
  token: string | null;
  isBootstrapping: boolean;
};

export type AuthContextValue = AuthState & {
  loginWithPassword: (email: string, password: string) => Promise<void>;
  registerAccount: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const hydrate = useCallback(async () => {
    const storedToken = await getStoredToken();
    if (!storedToken) {
      setTokenState(null);
      setUser(null);
      setBootstrapped(true);
      return;
    }
    setTokenState(storedToken);
    try {
      const profile = await fetchProfile();
      setUser(profile);
    } catch {
      await setStoredTokens(null, null);
      setTokenState(null);
      setUser(null);
    } finally {
      setBootstrapped(true);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const logout = useCallback(async () => {
    await setStoredTokens(null, null);
    setTokenState(null);
    setUser(null);
    triggerSoftRefresh(queryClientSingleton);
  }, []);

  const announceSessionExpired = useCallback(() => {
    Alert.alert('Session expired', 'Please sign in again to continue.', [{ text: 'OK' }]);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      void (async () => {
        announceSessionExpired();
        await logout();
        if (navigationRef.isReady()) {
          navigationRef.navigate('Auth');
        }
      })();
    };
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [announceSessionExpired, logout]);

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    const { token: nextToken, refreshToken: nextRefresh } = await loginUser({ email, password });
    await setStoredTokens(nextToken, nextRefresh);
    setTokenState(nextToken);
    const profile = await fetchProfile();
    setUser(profile);
  }, []);

  const registerAccount = useCallback(async (payload: { name: string; email: string; password: string }) => {
    const { token: issuedToken, refreshToken: issuedRefresh } = await registerUser(payload);
    if (issuedToken) {
      await setStoredTokens(issuedToken, issuedRefresh);
      setTokenState(issuedToken);
      const profile = await fetchProfile();
      setUser(profile);
      return;
    }
    await loginWithPassword(payload.email, payload.password);
  }, [loginWithPassword]);

  const refreshProfile = useCallback(async () => {
    if (!(await getStoredToken())) return;
    const profile = await fetchProfile();
    setUser(profile);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isBootstrapping: !bootstrapped,
      loginWithPassword,
      registerAccount,
      logout,
      refreshProfile,
    }),
    [user, token, bootstrapped, loginWithPassword, registerAccount, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider.');
  }
  return ctx;
}
