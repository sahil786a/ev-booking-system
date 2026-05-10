import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PartyPopper } from 'lucide-react-native';

import type { DiscoverStackParamList } from '../../navigation/UserNavigator';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Screen from '../../components/common/Screen';
import { colors, spacing, typography } from '../../styles/theme';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<DiscoverStackParamList, 'BookingSuccess'>,
  BottomTabNavigationProp<{
    Discover: undefined;
    BookingsTab: undefined;
    ProfileTab: undefined;
  }>
>;

type Route = RouteProp<DiscoverStackParamList, 'BookingSuccess'>;

export default function BookingSuccessScreen(): JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const bookingId = route.params?.bookingId;
  const navigateRoot = (name: string, params?: Record<string, unknown>) => {
    (navigation as unknown as { navigate: (n: string, p?: Record<string, unknown>) => void }).navigate(name, params);
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <PartyPopper size={34} color={colors.accentDark} />
        <Text style={styles.title}>You’re on the calendar</Text>
        <Text style={styles.subtitle}>
          {bookingId
            ? `Booking #${bookingId} is confirmed on the network.`
            : 'Booking confirmed — reference synced once the response includes an id.'}
        </Text>
      </View>
      <Card>
        <Text style={styles.body}>
          We’ll keep polling for slot updates. Phase 2 will stream live changes over WebSockets when the backend is ready.
        </Text>
      </Card>
      <Button
        title="View my bookings"
        onPress={() =>
          navigateRoot('BookingsTab', {
            screen: 'MyBookings',
          })
        }
      />
      <Button
        variant="secondary"
        title="Back to discovery"
        onPress={() => navigation.navigate('Home')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  body: {
    ...typography.caption,
  },
});
