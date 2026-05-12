import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Card from '../../components/common/Card';
import Screen from '../../components/common/Screen';
import { colors, spacing, typography } from '../../styles/theme';

type RouteParams = {
  ComingSoon: { title?: string };
};

export default function PhaseTwoComingSoonScreen(): JSX.Element {
  const route = useRoute<RouteProp<RouteParams, 'ComingSoon'>>();
  const title = route.params?.title ?? 'Powering up next release';

  return (
    <Screen>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.lead}>
        This feature relies on native device APIs and third-party map integrations (like Google Maps or Mapbox).
      </Text>
      <Card>
        <Text style={styles.bullet}>• In-app turn-by-turn navigation (Coming in Mobile V2).</Text>
        <Text style={styles.bullet}>• Advanced Map routing & traffic data.</Text>
        <Text style={styles.bullet}>• (Backend APIs for live sockets and arrivals are fully operational!)</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  lead: {
    ...typography.caption,
    marginBottom: spacing.lg,
    color: colors.textMuted,
  },
  bullet: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
});
