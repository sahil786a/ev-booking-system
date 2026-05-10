import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, spacing, typography } from '../../styles/theme';
import Button from './Button';

type Props = {
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onPressAction?: () => void;
};

export default function EmptyState({ title, subtitle, actionTitle, onPressAction }: Props): JSX.Element {
  return (
    <>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.body}>{subtitle}</Text> : null}
      {actionTitle && onPressAction ? (
        <Button variant="secondary" title={actionTitle} onPress={onPressAction} />
      ) : null}
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
