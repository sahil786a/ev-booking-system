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
        This experience needs a backend contract for sockets, no-show automation, or operator-facing webhooks. Until those ship, the mobile client polls REST
        endpoints so you’re never blocked.
      </Text>
      <Card>
        <Text style={styles.bullet}>• WebSocket or SSE channel for reservations (Requires backend Phase 2 endpoint).</Text>
        <Text style={styles.bullet}>• Server-triggered no-show + refunds (Requires backend Phase 2 endpoint).</Text>
        <Text style={styles.bullet}>• Push device registration (Requires backend Phase 2 endpoint).</Text>
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
