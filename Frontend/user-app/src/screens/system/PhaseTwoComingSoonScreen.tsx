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
        These features are on the roadmap and will ship in future releases of the mobile app.
      </Text>
      <Card>
        <Text style={styles.bullet}>• In-app turn-by-turn navigation (Google Maps / Mapbox SDK).</Text>
        <Text style={styles.bullet}>• Payments gateway — pay for sessions in-app.</Text>
        <Text style={styles.bullet}>• Offline SMS-based booking for areas with limited data.</Text>
        <Text style={styles.bullet}>• Push notifications for queue promotions and session reminders.</Text>
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
