import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../styles/theme';

export default function LoadingState({
  caption = 'Fetching the latest chargers…',
}: {
  caption?: string;
}): JSX.Element {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accentDark} />
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  caption: {
    ...typography.caption,
    textAlign: 'center',
  },
});
