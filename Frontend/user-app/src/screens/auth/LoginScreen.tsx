import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Screen from '../../components/common/Screen';
import { navigationRef } from '../../navigation/navigationRef';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../styles/theme';
import { normalizeApiError } from '../../api/client';
import { loginSchema } from '../../utils/validators';

type FormValues = {
  email: string;
  password: string;
};

export default function LoginScreen(): JSX.Element {
  const { loginWithPassword } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Login'>>();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await loginWithPassword(values.email.trim(), values.password);
      navigationRef.navigate('Main');
    } catch (error) {
      const normalized = normalizeApiError(error);
      setFormError(normalized.message);
    }
  });

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>EV Charge Booking</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to discover chargers, book time, and stay on schedule.</Text>
      </View>
      {formError ? <Text style={styles.banner}>{formError}</Text> : null}
      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            label="Password"
            secureTextEntry
            textContentType="password"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.password?.message}
          />
        )}
      />
      <Button
        variant="primary"
        title="Continue"
        loading={isSubmitting}
        onPress={() => onSubmit()}
      />
      <Button variant="ghost" title="Create an account" onPress={() => navigation.navigate('Register')} />
      <View style={styles.note}>
        <ArrowRight color={colors.accentDark} size={18} />
        <Text style={styles.noteText}>MVP build — payments & SMS arrive in a future release.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  kicker: {
    ...typography.small,
    color: colors.accentDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    ...typography.title,
    fontSize: 28,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  banner: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  noteText: {
    ...typography.small,
    flex: 1,
  },
});
