import React from 'react';
import {
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../../styles/theme';

type Props = Omit<ViewProps, 'children'> & {
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<unknown>;
  children?: React.ReactNode;
};

export default function Screen({
  scroll = true,
  scrollProps,
  padded = true,
  refreshing,
  onRefresh,
  children,
  style,
  ...viewProps
}: Props): JSX.Element {
  const contentInset = padded ? spacing.lg : 0;

  if (scroll) {
    return (
      <SafeAreaView style={[styles.flex, styles.background]}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                tintColor={colors.accentDark}
                refreshing={Boolean(refreshing)}
                onRefresh={() => {
                  void onRefresh();
                }}
              />
            ) : undefined
          }
          contentContainerStyle={[scrollProps?.contentContainerStyle, padded ? styles.paddingInset : undefined]}
          style={[styles.flex, style]}
          {...scrollProps}
          {...viewProps}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, styles.background, padded ? styles.paddingInset : undefined, style]}>
      <View style={styles.flex}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  background: {
    backgroundColor: colors.background,
  },
  paddingInset: {
    padding: spacing.lg,
  },
});
