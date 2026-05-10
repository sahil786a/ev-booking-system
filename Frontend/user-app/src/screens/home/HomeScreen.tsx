import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPin, Navigation, Radar, TimerReset } from 'lucide-react-native';

import type { DiscoverStackParamList } from '../../navigation/UserNavigator';
import type { Station } from '../../api/stationApi';
import BookingCard from '../../components/bookings/BookingCard';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import LoadingState from '../../components/common/LoadingState';
import Screen from '../../components/common/Screen';
import LocationPermissionCard from '../../components/location/LocationPermissionCard';
import NearbyStationCard from '../../components/location/NearbyStationCard';
import StationList from '../../components/stations/StationList';
import { useMyBookings } from '../../hooks/useBookings';
import { useDeviceLocation } from '../../hooks/useLocation';
import { useStations } from '../../hooks/useStations';
import { sortByNearest } from '../../services/distanceService';
import { colors, spacing, typography } from '../../styles/theme';
import { bookingNumericId } from '../../utils/booking';
import { normalizeApiError } from '../../api/client';

type HomeNav = CompositeNavigationProp<
  NativeStackNavigationProp<DiscoverStackParamList>,
  BottomTabNavigationProp<{
    Discover: undefined;
    BookingsTab: undefined;
    ProfileTab: undefined;
  }>
>;

export default function HomeScreen(): JSX.Element {
  const navigation = useNavigation<HomeNav>();
  const navigateRoot = (name: string, params?: Record<string, unknown>) => {
    (navigation as unknown as { navigate: (n: string, p?: Record<string, unknown>) => void }).navigate(name, params);
  };
  const stationsQuery = useStations(true);
  const bookingsQuery = useMyBookings(true);
  const location = useDeviceLocation(true);

  const nextBooking = useMemo(() => {
    const list = bookingsQuery.data ?? [];
    return (
      list.find((booking) => {
        const status = String(booking.status ?? '').toLowerCase();
        return ['pending', 'confirmed', 'active'].includes(status);
      }) ?? null
    );
  }, [bookingsQuery.data]);

  const featured = useMemo(() => {
    if (!stationsQuery.data || location.state.status !== 'ready') return null;
    const sorted = sortByNearest(stationsQuery.data, location.state.coords);
    return sorted[0] ?? null;
  }, [stationsQuery.data, location.state]);

  const distanceLookup = useMemo(() => {
    const map = new Map<string, number>();
    if (!stationsQuery.data || location.state.status !== 'ready') return map;
    sortByNearest(stationsQuery.data, location.state.coords).forEach((station) => {
      const id = String(station.id);
      if (typeof station.distanceKm === 'number') {
        map.set(id, station.distanceKm);
      }
    });
    return map;
  }, [stationsQuery.data, location.state]);

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
        <LoadingState />
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
        <ErrorState title="Unable to load chargers" message={message} onRetry={() => stationsQuery.refetch()} />
      </Screen>
    );
  }

  const stations = stationsQuery.data ?? [];

  const header = (
    <>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Charge on your terms</Text>
        <Text style={styles.title}>Discovery command center</Text>
        <Text style={styles.subtitle}>Live grid refreshed automatically every few seconds.</Text>
      </View>

      <View style={styles.shortcuts}>
        <Shortcut icon={<MapPin color="#fff" size={18} />} label="Nearby" onPress={() => navigation.navigate('Nearby')} />
        <Shortcut
          icon={<Navigation color="#fff" size={18} />}
          label="Navigate"
          onPress={() => navigation.navigate('ComingSoon', { title: 'Turn-by-turn routing' })}
        />
        <Shortcut
          icon={<Radar color="#fff" size={18} />}
          label="Permissions"
          onPress={() => navigateRoot('ProfileTab', { screen: 'LocationPermission' })}
        />
        <Shortcut
          icon={<TimerReset color="#fff" size={18} />}
          label="Bookings"
          onPress={() => navigateRoot('BookingsTab', { screen: 'MyBookings' })}
        />
      </View>

      {location.state.status === 'denied' || location.state.status === 'unable' ? (
        <View style={styles.section}>
          <LocationPermissionCard
            status={location.state.status === 'denied' ? 'denied' : 'unable'}
            onRequest={() => location.refresh()}
          />
        </View>
      ) : null}

      {nextBooking ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active booking</Text>
          <BookingCard
            booking={nextBooking}
            onPress={() => {
              const id = bookingNumericId(nextBooking);
              if (id != null) {
                navigateRoot('BookingsTab', {
                  screen: 'BookingDetail',
                  params: { bookingId: id },
                });
              }
            }}
          />
        </View>
      ) : null}

      {featured ? (
        <View style={styles.section}>
          <NearbyStationCard
            station={featured}
            distanceKm={featured.distanceKm}
            onPress={() => openStation(featured)}
          />
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All stations</Text>
        <Pressable onPress={() => navigation.navigate('Nearby')}>
          <Text style={styles.link}>Distance view</Text>
        </Pressable>
      </View>
    </>
  );

  const footer = (
    <Card style={styles.footerCard}>
      <View style={styles.brandRow}>
        <View style={styles.brandIcon}>
          <Text style={styles.brandIconText}>⚡</Text>
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brandTitle}>Next up on the roadmap</Text>
          <Text style={styles.brandSubtitle}>
            Arrival assist, vendor-side no-show sync, and real-time slot websockets are slated once the backend exposes
            those contracts.
          </Text>
        </View>
      </View>
    </Card>
  );

  const empty =
    stations.length === 0 ? (
      <Card>
        <EmptyState
          title="Nothing to plug into yet"
          subtitle="Ask your operator to publish a station, then pull to refresh."
          actionTitle="Retry"
          onPressAction={() => stationsQuery.refetch()}
        />
      </Card>
    ) : null;

  return (
    <Screen scroll={false}>
      <StationList
        stations={stations}
        header={header}
        footer={footer}
        empty={empty}
        distances={distanceLookup}
        onSelect={openStation}
        refreshing={stationsQuery.isFetching}
        onRefresh={() => {
          void stationsQuery.refetch();
        }}
      />
    </Screen>
  );
}

function Shortcut({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}): JSX.Element {
  return (
    <Pressable style={({ pressed }) => [styles.shortcut, pressed && { opacity: 0.9 }]} onPress={onPress}>
      <View style={styles.shortcutIcon}>{icon}</View>
      <Text style={styles.shortcutLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  kicker: {
    ...typography.small,
    color: colors.accentDark,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  shortcuts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  shortcut: {
    flexGrow: 1,
    minWidth: '45%',
    backgroundColor: colors.accentDark,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shortcutIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: {
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle,
  },
  link: {
    color: colors.accentDark,
    fontWeight: '600',
  },
  footerCard: {
    marginBottom: spacing.xxl,
  },
  brandRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  brandCopy: {
    flex: 1,
  },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconText: {
    fontSize: 22,
  },
  brandTitle: {
    ...typography.subtitle,
  },
  brandSubtitle: {
    ...typography.caption,
    marginTop: 4,
  },
});
