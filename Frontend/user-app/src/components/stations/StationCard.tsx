import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';

import type { Station } from '../../api/stationApi';
import { colors, spacing, typography } from '../../styles/theme';
import Card from '../common/Card';
import AvailabilityBadge from './AvailabilityBadge';

type Props = {
  station: Station;
  distanceKm?: number;
  availabilityLabel?: string;
  onPress: () => void;
};

export default function StationCard({
  station,
  distanceKm,
  availabilityLabel,
  onPress,
}: Props): JSX.Element {
  const title = station.name ?? 'Charging station';
  const secondary = station.city ?? station.address;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <AvailabilityBadge fallbackLabel={availabilityLabel} />
        </View>
        {secondary ? (
          <View style={styles.row}>
            <MapPin size={16} color={colors.textMuted} />
            <Text style={styles.subtitle} numberOfLines={2}>
              {secondary}
            </Text>
          </View>
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.meta}>ID #{String(station.id)}</Text>
          {distanceKm != null && Number.isFinite(distanceKm) ? (
            <Text style={styles.meta}>{distanceKm.toFixed(1)} km away</Text>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.caption,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  meta: {
    ...typography.small,
  },
});
