import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { cancelBooking } from '../../api/bookingApi';
import { checkIn, checkOut } from '../../api/arrivalApi';
import { normalizeApiError } from '../../api/client';
import type { BookingsStackParamList } from '../../navigation/UserNavigator';
import BookingTimeCard from '../../components/bookings/BookingTimeCard';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import LoadingState from '../../components/common/LoadingState';
import Screen from '../../components/common/Screen';
import { bookingQueryKeys } from '../../constants/queryKeys';
import { useBooking } from '../../hooks/useBookings';
import { distanceKm } from '../../services/distanceService';
import { ensureForegroundPermission } from '../../services/locationService';
import { openExternalDirections } from '../../services/navigationService';
import { colors, spacing, typography } from '../../styles/theme';
import { canUserCancel, stationLabelFromBooking } from '../../utils/booking';
import { shouldWarnImminent } from '../../utils/bookingTiming';

type Nav = NativeStackNavigationProp<BookingsStackParamList, 'BookingDetail'>;
type Route = RouteProp<BookingsStackParamList, 'BookingDetail'>;

export default function BookingDetailScreen(): JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const bookingId = Number(route.params.bookingId);
  const queryClient = useQueryClient();

  const bookingQuery = useBooking(Number.isFinite(bookingId) ? bookingId : undefined, true);
  const booking = bookingQuery.booking;

  useEffect(() => {
    if (bookingQuery.isPending) return;
    if (!Number.isFinite(bookingId) || !booking) {
      navigation.replace('NotFound');
    }
  }, [booking, bookingId, bookingQuery.isPending, navigation]);

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(bookingId),
    onSuccess: () => {
      Alert.alert('Cancelled', 'Your booking has been successfully cancelled.');
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.mine });
      navigation.goBack();
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      Alert.alert('Could not cancel', normalized.message);
    },
  });

  const warnImminent = useMemo(() => {
    if (!booking) return false;
    return shouldWarnImminent(booking.booking_date ?? booking.date, booking.start_time);
  }, [booking]);

  if (bookingQuery.isPending || !booking) {
    return (
      <Screen scroll={false}>
        <LoadingState caption="Opening your booking…" />
      </Screen>
    );
  }

  const title = stationLabelFromBooking(booking);
  const cancelable = canUserCancel(booking);

  const onCancel = () => {
    Alert.alert('Cancel session', 'This releases the slot for other drivers.', [
      { text: 'Go back', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: () => cancelMutation.mutate(),
      },
    ]);
  };

  const checkInMutation = useMutation({
    mutationFn: async (coords: { latitude: number; longitude: number }) => {
      return checkIn(bookingId, coords.latitude, coords.longitude);
    },
    onSuccess: (data) => {
      Alert.alert('Checked In!', `You are ${data.distance_m}m from the station.`);
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.mine });
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.detail(bookingId) });
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      Alert.alert('Check-in failed', normalized.message);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (coords: { latitude: number; longitude: number }) => {
      return checkOut(bookingId, coords.latitude, coords.longitude);
    },
    onSuccess: (data) => {
      Alert.alert('Checked Out!', `Session completed successfully.`);
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.mine });
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.detail(bookingId) });
      navigation.goBack();
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      Alert.alert('Check-out failed', normalized.message);
    },
  });

  const handleArrivalAction = async (action: 'checkin' | 'checkout') => {
    const coords = await ensureForegroundPermission();
    if (!coords) {
      Alert.alert('Location unavailable', 'Enable GPS to check in or out.');
      return;
    }
    
    if (action === 'checkin') {
      checkInMutation.mutate({ latitude: coords.latitude, longitude: coords.longitude });
    } else {
      checkOutMutation.mutate({ latitude: coords.latitude, longitude: coords.longitude });
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.meta}>
        Booking #{String(booking.id)} · {String(booking.status ?? 'unknown')}
      </Text>

      {warnImminent ? (
        <Card style={styles.warnCard}>
          <Text style={styles.warnText}>
            ⏱ Heads up — your session starts soon. Check in at the station to confirm your arrival and avoid a no-show mark.
          </Text>
        </Card>
      ) : null}

      <BookingTimeCard booking={booking} />

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Stay oriented</Text>
        <Text style={styles.bodyMuted}>
          Opens Google Maps with directions to the station. In-app navigation arrives in Phase 2.
        </Text>
        <Button
          variant="secondary"
          title="Open in Google Maps"
          onPress={async () => {
            try {
              const b = booking as any;
              const lat = b.latitude ?? b.station_lat;
              const lon = b.longitude ?? b.station_lon;
              if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) {
                Alert.alert('No coordinates', 'Station coordinates not available for this booking.');
                return;
              }
              await openExternalDirections(lat, lon, b.station_name ?? undefined);
            } catch (err) {
              Alert.alert('Directions error', 'Unable to open directions.');
            }
          }}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Station Arrival</Text>
        <Text style={styles.bodyMuted}>
          GPS check-in validates your physical presence at the station to prevent no-shows.
        </Text>
        {booking.status === 'booked' ? (
          <View style={{ gap: spacing.sm }}>
            <Button
              variant="primary"
              title="Check In Now"
              loading={checkInMutation.isPending}
              onPress={() => handleArrivalAction('checkin')}
            />
            <Button
              variant="secondary"
              title="End Session & Check Out"
              loading={checkOutMutation.isPending}
              onPress={() => handleArrivalAction('checkout')}
            />
          </View>
        ) : (
          <Text style={styles.warnText}>This booking is {booking.status}. Arrival actions disabled.</Text>
        )}
      </Card>

      {cancelable ? (
        <Button variant="danger" title="Cancel booking" loading={cancelMutation.isPending} onPress={onCancel} />
      ) : (
        <Card>
          <Text style={styles.bodyMuted}>
            This reservation is read-only because it already finished or was cancelled through another channel.
          </Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  warnCard: {
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft,
    marginBottom: spacing.lg,
  },
  warnText: {
    color: colors.text,
    fontWeight: '600',
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
  },
  bodyMuted: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
