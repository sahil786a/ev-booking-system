import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import LocationPermissionCard from '../../components/location/LocationPermissionCard';
import Screen from '../../components/common/Screen';
import type { ProfileStackParamList } from '../../navigation/UserNavigator';
import { useDeviceLocation } from '../../hooks/useLocation';
import { colors, spacing, typography } from '../../styles/theme';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'LocationPermission'>;

export default function LocationPermissionScreen(): JSX.Element {
  const navigation = useNavigation<Nav>();
  const location = useDeviceLocation(true);

  let status: 'denied' | 'prompt' | 'unable' = 'prompt';
  if (location.state.status === 'denied') status = 'denied';
  if (location.state.status === 'unable') status = 'unable';

  return (
    <Screen>
      <Text style={styles.title}>Location access</Text>
      <Text style={styles.body}>
        We only use foreground GPS to sort chargers and to power future arrival assist. Nothing leaves your phone besides API calls you
        already authorize.
      </Text>
      <LocationPermissionCard
        status={status}
        onRequest={async () => {
          const coords = await location.refresh();
          if (coords) {
            navigation.goBack();
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  body: {
    ...typography.caption,
    marginBottom: spacing.lg,
    color: colors.textMuted,
  },
});
