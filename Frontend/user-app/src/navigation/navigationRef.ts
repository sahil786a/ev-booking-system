import { createNavigationContainerRef } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
