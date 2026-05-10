import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { colors, radii, typography } from '../../styles/theme';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'accent';

export default function Badge({ label, tone = 'accent' }: { label: string; tone?: Tone }): JSX.Element {
  const scheme = TONES[tone];
  return (
    <View style={[styles.shell, scheme.shell]}>
      <Text style={[styles.text, scheme.text]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  text: {
    ...typography.small,
  },
});

type Scheme = {
  shell: ViewStyle;
  text: TextStyle;
};

const TONES: Record<Tone, Scheme> = {
  success: {
    shell: { backgroundColor: `${colors.success}12` },
    text: { color: colors.success, fontWeight: '600', fontSize: 12 },
  },
  warning: {
    shell: { backgroundColor: colors.warningSoft },
    text: { color: colors.warning, fontWeight: '700', fontSize: 12 },
  },
  danger: {
    shell: { backgroundColor: colors.dangerSoft },
    text: { color: colors.danger, fontWeight: '700', fontSize: 12 },
  },
  neutral: {
    shell: { backgroundColor: `${colors.border}55` },
    text: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  },
  accent: {
    shell: { backgroundColor: colors.accentSoft },
    text: { color: colors.accentDark, fontWeight: '700', fontSize: 12 },
  },
};
