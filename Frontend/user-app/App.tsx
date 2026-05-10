import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import * as Splash from 'expo-splash-screen';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { navigationRef } from './src/navigation/navigationRef';
import { queryClientSingleton } from './src/queryClient';

Splash.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  useEffect(() => {
    Splash.hideAsync().catch(() => undefined);
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClientSingleton}>
        <AuthProvider>
          <NavigationContainer ref={navigationRef}>
            <StatusBar barStyle="dark-content" />
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
