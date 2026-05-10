import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Screen from '../../components/common/Screen';
import { navigationRef } from '../../navigation/navigationRef';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuth } from '../../hooks/useAuth';
import { normalizeApiError } from '../../api/client';
import { colors, spacing, typography } from '../../styles/theme';
import { registerSchema } from '../../utils/validators';

type FormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterScreen(): JSX.Element {
  const { registerAccount } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Register'>>();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await registerAccount({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      navigationRef.navigate('Main');
    } catch (error) {
      const normalized = normalizeApiError(error);
      setFormError(normalized.message);
    }
  });

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.title}>Create your driver profile</Text>
        <Text style={styles.subtitle}>One account for every charger, booking, and nearby insight.</Text>
      </View>
      {formError ? <Text style={styles.banner}>{formError}</Text> : null}
      <Controller
        control={control}
        name="name"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input label="Full name" autoCapitalize="words" value={value} onBlur={onBlur} onChangeText={onChange} error={errors.name?.message} />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
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
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            label="Confirm password"
            secureTextEntry
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.confirmPassword?.message}
          />
        )}
      />
      <Button variant="primary" title="Start charging smarter" loading={isSubmitting} onPress={() => onSubmit()} />
      <Button variant="ghost" title="Back to login" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    fontSize: 24,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  banner: {
    ...typography.caption,
    color: '#dc2626',
    marginBottom: spacing.md,
  },
});
