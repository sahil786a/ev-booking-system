import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Booking } from '../../api/bookingApi';
import { spacing, typography } from '../../styles/theme';
import { stationLabelFromBooking } from '../../utils/booking';

import Card from '../common/Card';

import BookingStatusBadge from './BookingStatusBadge';

type Props = {
  booking: Booking;
  onPress: () => void;
};

export default function BookingCard({ booking, onPress }: Props): JSX.Element {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}>
      <Card>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {stationLabelFromBooking(booking)}
          </Text>
          <BookingStatusBadge booking={booking} />
        </View>
        <Text style={styles.meta}>
          {(booking.booking_date ?? booking.date) ?? '—'}
          {booking.start_time && booking.end_time
            ? ` · ${booking.start_time}-${booking.end_time}`
            : booking.start_time
              ? ` · ${booking.start_time}`
              : ''}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.subtitle,
    flex: 1,
  },
  meta: {
    ...typography.caption,
  },
});
