import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import type { Booking } from '../../api/bookingApi';
import type { BookingsStackParamList } from '../../navigation/UserNavigator';
import BookingCard from '../../components/bookings/BookingCard';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import LoadingState from '../../components/common/LoadingState';
import Screen from '../../components/common/Screen';
import { useMyBookings } from '../../hooks/useBookings';
import { spacing } from '../../styles/theme';
import { bookingNumericId } from '../../utils/booking';
import { normalizeApiError } from '../../api/client';

type Nav = NativeStackNavigationProp<BookingsStackParamList, 'MyBookings'>;

export default function MyBookingsScreen(): JSX.Element {
  const navigation = useNavigation<Nav>();
  const bookingsQuery = useMyBookings(true);

  const open = (booking: Booking) => {
    const id = bookingNumericId(booking);
    if (id == null) {
      navigation.navigate('NotFound');
      return;
    }
    navigation.navigate('BookingDetail', { bookingId: id });
  };

  if (bookingsQuery.isPending) {
    return (
      <Screen scroll={false}>
        <LoadingState />
      </Screen>
    );
  }

  if (bookingsQuery.isError) {
    const message = normalizeApiError(bookingsQuery.error).message;
    return (
      <Screen
        scroll={false}
        refreshing={bookingsQuery.isFetching}
        onRefresh={() => {
          void bookingsQuery.refetch();
        }}>
        <ErrorState title="Unable to reach bookings" message={message} onRetry={() => bookingsQuery.refetch()} />
      </Screen>
    );
  }

  const data = bookingsQuery.data ?? [];

  return (
    <Screen scroll={false}>
      <FlatList
        contentContainerStyle={styles.list}
        data={data}
        keyExtractor={(item, index) =>
          item.id != null ? String(item.id) : `booking-${index}`
        }
        refreshing={bookingsQuery.isFetching}
        onRefresh={() => {
          void bookingsQuery.refetch();
        }}
        ListEmptyComponent={
          <Card>
            <EmptyState
              title="No sessions yet"
              subtitle="Book a slot from Discover and it will appear here instantly."
              actionTitle="Find chargers"
              onPressAction={() => {
                navigation.getParent()?.navigate('Discover', { screen: 'Home' });
              }}
            />
          </Card>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <BookingCard booking={item} onPress={() => open(item)} />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: 120,
    gap: spacing.md,
  },
  item: {
    marginBottom: spacing.md,
  },
});
