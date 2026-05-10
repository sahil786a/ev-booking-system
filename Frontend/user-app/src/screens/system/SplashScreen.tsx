import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';

import type { RootStackParamList } from '../../navigation/navigationRef';
import { useAuth } from '../../hooks/useAuth';
import LoadingState from '../../components/common/LoadingState';
import Screen from '../../components/common/Screen';

export default function SplashScreen(): JSX.Element {
  const { token, isBootstrapping } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (isBootstrapping) return;
    if (token) {
      navigation.replace('Main');
    } else {
      navigation.replace('Auth');
    }
  }, [isBootstrapping, navigation, token]);

  return (
    <Screen scroll={false}>
      <LoadingState caption="Restoring your EV session…" />
    </Screen>
  );
}
