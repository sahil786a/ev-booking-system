import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { colors, typography } from '../styles/theme';

export const stackScreenOptions: NativeStackNavigationOptions = {
  headerTitleStyle: {
    ...typography.subtitle,
  },
  headerTintColor: colors.accentDark,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.background },
};
