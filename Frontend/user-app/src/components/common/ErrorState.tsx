import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, spacing, typography } from '../../styles/theme';

import Button from './Button';

type Props = {
  title: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export default function ErrorState({ title, message, retryLabel = 'Try again', onRetry }: Props): JSX.Element {
  return (
    <>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.body}>{message}</Text> : null}
      {onRetry ? <Button variant="secondary" title={retryLabel} onPress={onRetry} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.subtitle,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  body: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
});
