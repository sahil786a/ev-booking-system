import React, { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { colors, radii, typography } from '../../styles/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
};

const Input = forwardRef<TextInput, Props>(
  ({ label, error, helper, containerStyle, style, editable = true, ...props }, ref) => {
    return (
      <View style={[styles.field, containerStyle]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input as TextStyle,
            !editable && styles.inputDisabled,
            error ? styles.inputErrorState : undefined,
            style as TextStyle,
          ]}
          editable={editable}
          {...props}
        />
        {helper && !error ? <Text style={styles.helper}>{helper}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

export default Input;

const styles = StyleSheet.create({
  field: {
    marginBottom: 12,
  },
  label: {
    ...typography.caption,
    marginBottom: 6,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: PlatformSelectPadding(),
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    minHeight: 48,
  } as TextStyle,
  inputErrorState: {
    borderColor: colors.danger,
  },
  helper: {
    ...typography.small,
    marginTop: 4,
  },
  error: {
    ...typography.small,
    marginTop: 4,
    color: colors.danger,
  },
  inputDisabled: {
    opacity: 0.55,
  },
});

function PlatformSelectPadding(): number {
  /* Keep comfortable touch height */
  return 12;
}
