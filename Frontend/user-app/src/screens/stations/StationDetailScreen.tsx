import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
import { colors, spacing, typography } from '../../styles/theme';
import { todayDateString } from '../../utils/dateFormat';
import { normalizeApiError } from '../../api/client';

type Nav = NativeStackNavigationProp<DiscoverStackParamList, 'StationDetail'>;
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

  const station = stationQuery.data;
  const [arrivalHint, setArrivalHint] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(stationId)) {
      navigation.replace('NotFound');
    }
  }, [navigation, stationId]);

  const distanceLabel = useMemo(() => {
    if (!station || location.state.status !== 'ready') return null;
    const lat = station.lat ?? null;
    const lng = station.lng ?? null;
    if (lat == null || lng == null) return 'Add coordinates to this station to unlock distance math.';
    const d = distanceKm(location.state.coords.latitude, location.state.coords.longitude, lat, lng);
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
        <Text style={styles.sectionLabel}>Arrival assist</Text>
        <Text style={styles.bodyMuted}>
          Tap simulate proximity to preview the in-app prompt. Server-side validation requires backend Phase 2 endpoint.
        </Text>
        <Button
          variant="secondary"
          title="Simulate proximity check"
          onPress={() => {
            if (!station.lat || !station.lng || location.state.status !== 'ready') {
              setArrivalHint('Need both station coordinates and GPS to evaluate proximity locally.');
              return;
            }
            const d = distanceKm(
              location.state.coords.latitude,
              location.state.coords.longitude,
              station.lat,
              station.lng,
            );
            if (d <= 0.2) {
              setArrivalHint('You are near the station • Ready to plug in when your slot opens.');
            } else {
              setArrivalHint(`Still ~${(d * 1000).toFixed(0)}m out — keep rolling.`);
            }
          }}
        />
        {arrivalHint ? <Text style={styles.hint}>{arrivalHint}</Text> : null}
        <Button
          variant="ghost"
          title="Navigation preview (placeholder)"
          onPress={() => navigation.navigate('ComingSoon', { title: 'In-app turn-by-turn' })}
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
