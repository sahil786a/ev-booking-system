import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';

import type { DiscoverStackParamList } from '../../navigation/UserNavigator';
import AvailabilityBadge from '../../components/stations/AvailabilityBadge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import ErrorState from '../../components/common/ErrorState';
import LoadingState from '../../components/common/LoadingState';
import Screen from '../../components/common/Screen';
import { useStationAvailability, useStationDetail } from '../../hooks/useStations';
import { useDeviceLocation } from '../../hooks/useLocation';
import { distanceKm } from '../../services/distanceService';
import { openExternalDirections } from '../../services/navigationService';
import { useStationRealtime } from '../../services/realtimeService';
import { colors, spacing, typography } from '../../styles/theme';
import { todayDateString } from '../../utils/dateFormat';
import { normalizeApiError } from '../../api/client';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<DiscoverStackParamList, 'StationDetail'>,
  BottomTabNavigationProp<{
    Discover: undefined;
    BookingsTab: { screen?: string; params?: Record<string, unknown> } | undefined;
    ProfileTab: { screen?: string; params?: Record<string, unknown> } | undefined;
  }>
>;
type Route = RouteProp<DiscoverStackParamList, 'StationDetail'>;

export default function StationDetailScreen(): JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const stationId = Number(route.params.stationId);
  const location = useDeviceLocation(true);
  const stationQuery = useStationDetail(Number.isFinite(stationId) ? stationId : undefined, true);
  const today = todayDateString();
  const availabilityQuery = useStationAvailability({
    stationId: Number.isFinite(stationId) ? stationId : undefined,
    bookingDate: today,
    enabled: Number.isFinite(stationId),
  });
  
  const queryClient = useQueryClient();
  useStationRealtime(Number.isFinite(stationId) ? stationId : undefined, queryClient);

  const station = stationQuery.data;
  const [arrivalHint, setArrivalHint] = useState<string | null>(null);

  // Refresh location when screen mounts to ensure fresh coordinates
  useEffect(() => {
    if (location.state.status === 'unknown') {
      location.refresh().catch(() => {
        console.error('Failed to refresh location');
      });
    }
  }, []);

  useEffect(() => {
    if (!Number.isFinite(stationId)) {
      navigation.replace('NotFound');
    }
  }, [navigation, stationId]);

  const distanceLabel = useMemo(() => {
    if (!station || location.state.status !== 'ready') return null;
    const lat = Number(station.lat ?? station.latitude);
    const lng = Number(station.lng ?? station.longitude);
    const userLat = location.state.coords.latitude;
    const userLng = location.state.coords.longitude;
    
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return 'Coordinates not available';
    }
    
    const d = distanceKm(userLat, userLng, lat, lng);
    if (!Number.isFinite(d) || d < 0) {
      return 'Unable to calculate distance';
    }
    return `${d.toFixed(1)} km away`;
  }, [location.state, station]);

  useEffect(() => {
    if (!Number.isFinite(stationId)) {
      return;
    }
    if (stationQuery.isSuccess && !station) {
      navigation.replace('NotFound');
    }
  }, [navigation, station, stationId, stationQuery.isSuccess]);

  if (!Number.isFinite(stationId)) {
    return <></>;
  }

  if (stationQuery.isPending || availabilityQuery.isPending) {
    return (
      <Screen>
        <LoadingState caption="Loading station playbook…" />
      </Screen>
    );
  }

  if (stationQuery.isError) {
    const message = normalizeApiError(stationQuery.error).message;
    return (
      <Screen
        refreshing={stationQuery.isFetching}
        onRefresh={() => {
          availabilityQuery.refetch();
          stationQuery.refetch();
        }}>
        <ErrorState title="Station unavailable" message={message} onRetry={() => stationQuery.refetch()} />
      </Screen>
    );
  }

  if (!station) {
    return <></>;
  }

  const snapshot = availabilityQuery.data ?? undefined;
  const title = station.name ?? 'Charging hub';

  return (
    <Screen
      refreshing={stationQuery.isFetching || availabilityQuery.isFetching}
      onRefresh={() => {
        stationQuery.refetch();
        availabilityQuery.refetch();
      }}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <AvailabilityBadge snapshot={snapshot} fallbackLabel="Tap book to confirm slots" />
      </View>
      {station.address ? <Text style={styles.meta}>{station.address}</Text> : null}
      {station.description ? <Text style={styles.body}>{String(station.description)}</Text> : null}
      {distanceLabel ? (
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>From your position</Text>
          <Text style={styles.metricValue}>{distanceLabel}</Text>
          <Text style={styles.caption}>Distances are computed on-device for privacy.</Text>
        </Card>
      ) : null}

      <Card style={styles.arrival}>
        <Text style={styles.sectionLabel}>Station Check-In</Text>
        <Text style={styles.bodyMuted}>
          GPS check-in is required when you arrive to confirm your reservation and prevent no-show cancellations.
        </Text>
        <Button
          variant="secondary"
          title="Check in via Booking details"
          onPress={() => {
            navigation.navigate('BookingsTab', { screen: 'MyBookings' });
          }}
        />
        <Button
          variant="ghost"
          title="Get Directions"
          onPress={async () => {
            try {
              const lat = station.lat ?? station.latitude;
              const lng = station.lng ?? station.longitude;
              if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
                Alert.alert('No coordinates', 'This station does not have GPS coordinates set.');
                return;
              }
              await openExternalDirections(lat as any, lng as any, station.name ?? undefined);
            } catch (err) {
              Alert.alert('Directions error', 'Unable to open directions.');
            }
          }}
        />
      </Card>

      <Button
        variant="primary"
        title="Reserve a slot"
        onPress={() =>
          navigation.navigate('BookSlot', {
            stationId,
            stationName: title,
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    flex: 1,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  bodyMuted: {
    ...typography.caption,
    marginBottom: spacing.md,
    color: colors.textMuted,
  },
  metricCard: {
    marginBottom: spacing.lg,
  },
  metricLabel: {
    ...typography.small,
    textTransform: 'uppercase',
    color: colors.accentDark,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  caption: {
    ...typography.small,
    marginTop: spacing.sm,
  },
  arrival: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.subtitle,
  },
  hint: {
    ...typography.caption,
    color: colors.accentDark,
  },
});
