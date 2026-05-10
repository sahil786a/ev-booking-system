import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Station } from '../../api/stationApi';
import { colors, spacing, typography } from '../../styles/theme';

import StationCard from '../stations/StationCard';

type Props = {
  station: Station;
  distanceKm?: number;
  onPress: () => void;
};

export default function NearbyStationCard({ station, distanceKm, onPress }: Props): JSX.Element {
  return (
    <View>
      <Text style={styles.kicker}>Recommended for you</Text>
      <StationCard
        station={station}
        distanceKm={distanceKm}
        availabilityLabel="Near your location"
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: {
    ...typography.small,
    color: colors.accentDark,
    marginBottom: spacing.sm,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
