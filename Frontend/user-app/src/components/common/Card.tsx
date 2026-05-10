import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { colors, radii, shadows } from '../../styles/theme';

type Props = ViewProps & {
  children?: React.ReactNode;
};

export default function Card({ style, children, ...props }: Props): JSX.Element {
  return (
    <View style={[styles.card, shadows, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
  },
});
