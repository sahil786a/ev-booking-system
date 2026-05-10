import React from 'react';
import { FlatList, ListRenderItem, StyleSheet, View } from 'react-native';

import type { Station } from '../../api/stationApi';
import { spacing } from '../../styles/theme';

import StationCard from './StationCard';

type Props = {
  stations: Station[];
  distances?: Map<string, number>;
  availabilityLabels?: Map<string, string>;
  onSelect: (station: Station) => void;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  empty?: React.ReactNode;
};

export default function StationList({
  stations,
  distances,
  availabilityLabels,
  onSelect,
  refreshing,
  onRefresh,
  header,
  footer,
  empty,
}: Props): JSX.Element {
  const renderItem: ListRenderItem<Station> = ({ item }) => (
    <StationCard
      station={item}
      distanceKm={distances?.get(String(item.id))}
      availabilityLabel={availabilityLabels?.get(String(item.id))}
      onPress={() => onSelect(item)}
    />
  );

  return (
    <FlatList
      style={styles.flex}
      data={stations}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={header ? () => <>{header}</> : undefined}
      ListFooterComponent={footer ? () => <>{footer}</> : undefined}
      ListEmptyComponent={empty ? () => <>{empty}</> : undefined}
      contentContainerStyle={[styles.list, stations.length === 0 ? styles.flexGrow : undefined]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexGrow: { flexGrow: 1 },
  list: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  separator: {
    height: 0,
  },
});
