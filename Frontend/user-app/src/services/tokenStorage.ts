import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../utils/constants';

export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
    }
  } catch {
    // ignore persistence errors — session still works until restart
  }
}
