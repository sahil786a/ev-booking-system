import { zodResolver } from '@hookform/resolvers/zod';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { createBooking } from '../../api/bookingApi';
import { normalizeApiError } from '../../api/client';
import type { DiscoverStackParamList } from '../../navigation/UserNavigator';
import AvailabilityBadge from '../../components/stations/AvailabilityBadge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Screen from '../../components/common/Screen';
import { bookingQueryKeys, stationQueryKeys } from '../../constants/queryKeys';
import { useStationAvailability } from '../../hooks/useStations';
import { colors, spacing, typography } from '../../styles/theme';
import { bookingNumericId } from '../../utils/booking';
import { normalizeTimeInput, todayDateString } from '../../utils/dateFormat';
import { immediateBookingSchema, scheduledBookingSchema } from '../../utils/validators';

type Nav = NativeStackNavigationProp<DiscoverStackParamList, 'BookSlot'>;
type Route = RouteProp<DiscoverStackParamList, 'BookSlot'>;

type ScheduledValues = {
  stationId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
};

const buildDefaults = (stationId: number): ScheduledValues => ({
  stationId,
  bookingDate: todayDateString(),
  startTime: '09:00',
  endTime: '10:00',
});

export default function BookSlotScreen(): JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const stationId = route.params.stationId;
  const stationName = route.params.stationName;

  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [formError, setFormError] = useState<string | null>(null);

  const scheduledForm = useForm<ScheduledValues>({
    defaultValues: buildDefaults(stationId),
    resolver: zodResolver(scheduledBookingSchema),
  });

  const bookingDateWatch = scheduledForm.watch('bookingDate');
  const startWatch = scheduledForm.watch('startTime');
  const endWatch = scheduledForm.watch('endTime');

  const scope = useMemo(
    () => ({
      booking_date: bookingDateWatch,
      start_time: normalizeTimeInput(startWatch),
      end_time: normalizeTimeInput(endWatch),
    }),
    [bookingDateWatch, startWatch, endWatch],
  );

  const availabilityQuery = useStationAvailability({
    stationId,
    bookingDate: scope.booking_date,
    startTime: scope.start_time,
    endTime: scope.end_time,
    enabled: mode === 'scheduled',
  });

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'immediate') {
        const parsed = immediateBookingSchema.safeParse({ stationId });
        if (!parsed.success) {
          throw new Error('Unable to validate quick booking.');
        }
        return createBooking({ station_id: stationId });
      }
      const values = scheduledForm.getValues();
      const parsed = scheduledBookingSchema.safeParse({
        ...values,
        startTime: normalizeTimeInput(values.startTime),
        endTime: normalizeTimeInput(values.endTime),
      });
      if (!parsed.success) {
        const message = parsed.error.flatten().fieldErrors
          ? Object.values(parsed.error.flatten().fieldErrors).flat()[0]
          : parsed.error.message;
        throw new Error(typeof message === 'string' ? message : 'Fix the highlighted fields.');
      }
      return createBooking({
        station_id: stationId,
        booking_date: values.bookingDate,
        start_time: normalizeTimeInput(values.startTime),
        end_time: normalizeTimeInput(values.endTime),
      });
    },
    onSuccess: async (booking) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bookingQueryKeys.mine }),
        queryClient.invalidateQueries({ queryKey: stationQueryKeys.list }),
        queryClient.invalidateQueries({ queryKey: stationQueryKeys.detail(stationId) }),
      ]);
      const id = bookingNumericId(booking);
      navigation.replace('BookingSuccess', { bookingId: id ?? undefined });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      if (normalized.status === 409) {
        Alert.alert('No availability', normalized.message);
      } else {
        setFormError(normalized.message);
      }
    },
  });

  const toggleImmediate = () => {
    setMode('immediate');
    setFormError(null);
  };

  const toggleScheduled = () => {
    setMode('scheduled');
    setFormError(null);
  };

  return (
    <Screen>
      <Text style={styles.title}>{stationName ?? 'Reserve energy'}</Text>
      <Text style={styles.subtitle}>Station #{stationId}</Text>

      <View style={styles.modeRow}>
        <Button
          variant={mode === 'immediate' ? 'primary' : 'secondary'}
          title="Next available"
          onPress={toggleImmediate}
        />
        <Button
          variant={mode === 'scheduled' ? 'primary' : 'secondary'}
          title="Pick a window"
          onPress={toggleScheduled}
        />
      </View>

      {mode === 'scheduled' ? (
        <Card style={styles.availability}>
          <Text style={styles.cardTitle}>Live availability</Text>
          <AvailabilityBadge snapshot={availabilityQuery.data ?? undefined} />
          {availabilityQuery.isError ? (
            <Text style={styles.warningText}>
              Could not read availability grid — you can still try to book and the API will enforce overlaps.
            </Text>
          ) : null}
        </Card>
      ) : null}

      {formError ? <Text style={styles.errorBanner}>{formError}</Text> : null}

      {mode === 'scheduled' ? (
        <>
          <Controller
            control={scheduledForm.control}
            name="bookingDate"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                label="Date (YYYY-MM-DD)"
                autoCapitalize="none"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={scheduledForm.formState.errors.bookingDate?.message as string | undefined}
              />
            )}
          />
          <Controller
            control={scheduledForm.control}
            name="startTime"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                label="Start time (24h)"
                autoCapitalize="none"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={scheduledForm.formState.errors.startTime?.message as string | undefined}
              />
            )}
          />
          <Controller
            control={scheduledForm.control}
            name="endTime"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                label="End time (24h)"
                autoCapitalize="none"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={scheduledForm.formState.errors.endTime?.message as string | undefined}
              />
            )}
          />
        </>
      ) : (
        <Card>
          <Text style={styles.body}>
            We’ll request whatever slot the backend considers “next” for this charger. Great for on-the-go sessions.
          </Text>
        </Card>
      )}

      <Button
        variant="primary"
        title={mode === 'immediate' ? 'Book now' : 'Confirm reservation'}
        loading={bookingMutation.isPending}
        onPress={async () => {
          setFormError(null);
          if (mode === 'scheduled') {
            const valid = await scheduledForm.trigger();
            if (!valid) {
              setFormError('Please fix the booking window fields.');
              return;
            }
          }
          bookingMutation.mutate();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  availability: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.subtitle,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
  },
  errorBanner: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.caption,
  },
});
