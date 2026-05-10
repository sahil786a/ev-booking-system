import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DiscoverStackParamList } from '../../navigation/UserNavigator';
import type { Station } from '../../api/stationApi';
import ErrorState from '../../components/common/ErrorState';
import LoadingState from '../../components/common/LoadingState';
import Screen from '../../components/common/Screen';
import LocationPermissionCard from '../../components/location/LocationPermissionCard';
import StationList from '../../components/stations/StationList';
import { useDeviceLocation } from '../../hooks/useLocation';
import { useStations } from '../../hooks/useStations';
import { sortByNearest } from '../../services/distanceService';
import { colors, spacing, typography } from '../../styles/theme';
import { normalizeApiError } from '../../api/client';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<DiscoverStackParamList>,
  BottomTabNavigationProp<{
    Discover: undefined;
    BookingsTab: undefined;
    ProfileTab: undefined;
  }>
>;

export default function NearbyStationsScreen(): JSX.Element {
  const navigation = useNavigation<Nav>();
  const stationsQuery = useStations(true);
  const location = useDeviceLocation(true);

  const ranked = useMemo(() => {
    if (!stationsQuery.data) return [];
    if (location.state.status !== 'ready') {
      return stationsQuery.data;
    }
    return sortByNearest(stationsQuery.data, location.state.coords);
  }, [stationsQuery.data, location.state]);

  const distances = useMemo(() => {
    const map = new Map<string, number>();
    ranked.forEach((station) => {
      if (typeof station.distanceKm === 'number') {
        map.set(String(station.id), station.distanceKm);
      }
    });
    return map;
  }, [ranked]);

  const openStation = (station: Station) => {
    const id = Number(station.id);
    if (!Number.isFinite(id)) {
      navigation.navigate('NotFound');
      return;
    }
    navigation.navigate('StationDetail', { stationId: id });
  };

  if (stationsQuery.isPending) {
    return (
      <Screen scroll={false}>
        <LoadingState caption="Aligning chargers relative to you…" />
      </Screen>
    );
  }

  if (stationsQuery.isError) {
    const message = normalizeApiError(stationsQuery.error).message;
    return (
      <Screen
        scroll={false}
        refreshing={stationsQuery.isFetching}
        onRefresh={() => {
          void stationsQuery.refetch();
        }}>
        <ErrorState title="Couldn’t sync the grid" message={message} onRetry={() => stationsQuery.refetch()} />
      </Screen>
    );
  }

  const header = (
    <View style={styles.intro}>
      <Text style={styles.title}>Nearby intelligence</Text>
      <Text style={styles.body}>
        {location.state.status === 'ready'
          ? 'Distances use your live GPS position and update whenever you refresh.'
          : 'Enable location to unlock precise ordering. Stations still appear without GPS.'}
      </Text>
      {location.state.status === 'denied' || location.state.status === 'unable' ? (
        <LocationPermissionCard
          status={location.state.status === 'denied' ? 'denied' : 'unable'}
          onRequest={() => location.refresh()}
        />
      ) : null}
    </View>
  );

  return (
    <Screen scroll={false}>
      <StationList
        stations={ranked}
        distances={distances}
        header={header}
        onSelect={openStation}
        refreshing={stationsQuery.isFetching || location.loading}
        onRefresh={() => {
          void Promise.all([stationsQuery.refetch(), location.refresh()]);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
