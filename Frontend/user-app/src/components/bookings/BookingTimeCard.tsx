import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Booking } from '../../api/bookingApi';
import { colors, spacing, typography } from '../../styles/theme';
import { formatRelativeCountdown, shouldWarnImminent } from '../../utils/bookingTiming';

import Card from '../common/Card';
import Badge from '../common/Badge';

export default function BookingTimeCard({ booking }: { booking: Booking }): JSX.Element {
  const date = booking.booking_date ?? booking.date;
  const start = booking.start_time;
  const end = booking.end_time;

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((val) => val + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const countdown = useMemo(() => formatRelativeCountdown(date, start, tick), [date, start, tick]);
  const warn = useMemo(() => shouldWarnImminent(date, start), [date, start, tick]);

  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.title}>Your session window</Text>
        <Badge label="Local countdown" tone={warn ? 'warning' : 'neutral'} />
      </View>
      <Text style={styles.body}>
        {date ? `${date}` : 'Immediate slot'}
        {start && end ? ` · ${start} – ${end}` : start ? ` · ${start}` : ''}
      </Text>
      <Text style={[styles.countdown, warn && styles.warn]}>
        {countdown ?? 'No-show automation requires a backend Phase 2 endpoint — timer is local only.'}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    flex: 1,
  },
  body: {
    ...typography.caption,
  },
  countdown: {
    ...typography.small,
    marginTop: spacing.sm,
  },
  warn: {
    color: colors.warning,
    fontWeight: '700',
  },
});
