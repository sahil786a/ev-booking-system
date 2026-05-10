import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../styles/theme';
import Button from '../common/Button';
import Card from '../common/Card';

type Props = {
  onRequest: () => void;
  status: 'denied' | 'prompt' | 'unable';
};

export default function LocationPermissionCard({ onRequest, status }: Props): JSX.Element {
  const copy =
    status === 'denied'
      ? 'Location permission is off. Enable it from settings to unlock nearby chargers.'
      : status === 'unable'
        ? 'We couldn’t read your GPS signal. Move outdoors and try again.'
        : 'Allow location to prioritize nearby hubs and future arrival assist features.';

  return (
    <Card>
      <Text style={styles.title}>Location for smarter charging</Text>
      <Text style={styles.body}>{copy}</Text>
      <View style={styles.actions}>
        <Button title="Grant access" onPress={onRequest} />
        {status === 'denied' ? (
          <Button variant="secondary" title="Open settings" onPress={() => Linking.openSettings()} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.subtitle,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.caption,
    marginBottom: spacing.lg,
    color: colors.textMuted,
  },
  actions: {
    gap: spacing.sm,
  },
});
