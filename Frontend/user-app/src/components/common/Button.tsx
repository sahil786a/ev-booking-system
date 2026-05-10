import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { colors, radii, typography } from '../../styles/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: Variant;
  icon?: React.ReactNode;
};

export default function Button({
  title,
  loading,
  variant = 'primary',
  icon,
  style,
  disabled,
  ...props
}: Props): JSX.Element {
  const scheme = VARIANTS[variant];
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        scheme.container,
        isDisabled ? styles.disabled : null,
        pressed && !isDisabled ? styles.pressed : null,
        style as ViewStyle,
      ]}>
      <Text style={[styles.text, scheme.text]}>{title}</Text>
      {loading ? <ActivityIndicator color={scheme.spinnerColor} style={styles.spinner} /> : null}
      {!loading ? icon ?? null : null}
    </Pressable>
  );
}

const VARIANTS: Record<
  Variant,
  { container: ViewStyle; text: TextStyle; spinnerColor: string }
> = {
  primary: {
    container: { backgroundColor: colors.accentDark },
    text: { color: '#fff' },
    spinnerColor: '#fff',
  },
  secondary: {
    container: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    text: { color: colors.text },
    spinnerColor: colors.accentDark,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.accentDark },
    spinnerColor: colors.accentDark,
  },
  danger: {
    container: { backgroundColor: colors.danger },
    text: { color: '#fff' },
    spinnerColor: '#fff',
  },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  spinner: {
    marginLeft: 8,
  },
  text: {
    ...typography.subtitle,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.994 }],
  },
});
