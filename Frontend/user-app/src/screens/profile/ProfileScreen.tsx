import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BellRing, MapPinned, Sparkles } from 'lucide-react-native';

import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Screen from '../../components/common/Screen';
import { useAuth } from '../../hooks/useAuth';
import { navigationRef } from '../../navigation/navigationRef';
import type { ProfileStackParamList } from '../../navigation/UserNavigator';
import { colors, spacing, typography } from '../../styles/theme';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export default function ProfileScreen(): JSX.Element {
  const { user, logout, refreshProfile } = useAuth();
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    refreshProfile().catch(() => undefined);
  }, [refreshProfile]);

  const handleLogout = async () => {
    await logout();
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        }),
      );
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Account center</Text>
      <Text style={styles.subtitle}>Personalize EV journeys — payments stay out of scope for MVP.</Text>

      <Card style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user?.name ?? 'Not shared yet'}</Text>
        <Text style={[styles.label, styles.gap]}>Email</Text>
        <Text style={styles.value}>{user?.email ?? '—'}</Text>
      </Card>

      <Card style={styles.linkCard}>
        <View style={styles.row}>
          <MapPinned color={colors.accentDark} />
          <Text style={styles.linkCopy}>Location powers nearby ordering & arrival experiments.</Text>
        </View>
        <Button variant="secondary" title="Manage GPS access" onPress={() => navigation.navigate('LocationPermission')} />
      </Card>

      <Card style={styles.linkCard}>
        <View style={styles.row}>
          <Sparkles color={colors.warning} />
          <Text style={styles.linkCopy}>Preview the roadmap for sockets, no-show syncing, and push cues.</Text>
        </View>
        <Button variant="secondary" title="See Phase 2 backlog" onPress={() => navigation.navigate('ComingSoon', { title: 'Phase 2 backlog' })} />
      </Card>

      <Card style={styles.linkCard}>
        <View style={styles.row}>
          <BellRing color={colors.info} />
          <Text style={styles.linkCopy}>Notifications remain local-only until a backend bridge exists.</Text>
        </View>
      </Card>

      <Button variant="danger" title="Log out" onPress={() => void handleLogout()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.xl,
    color: colors.textMuted,
  },
  card: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.small,
    color: colors.textMuted,
  },
  value: {
    ...typography.subtitle,
  },
  gap: {
    marginTop: spacing.md,
  },
  linkCard: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  linkCopy: {
    ...typography.caption,
    flex: 1,
  },
});
