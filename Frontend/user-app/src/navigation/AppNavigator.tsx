import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import SplashScreen from '../screens/system/SplashScreen';

import AuthNavigator from './AuthNavigator';
import UserNavigator from './UserNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator(): JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        animation: 'fade',
        headerShown: false,
      }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="Main" component={UserNavigator} />
    </Stack.Navigator>
  );
}
