import { useQuery } from '@tanstack/react-query';

import type { Booking } from '../api/bookingApi';
import { fetchMyBookings } from '../api/bookingApi';
import { bookingQueryKeys } from '../constants/queryKeys';
import { defaultPollIntervalMs } from '../services/realtimeService';
import { bookingNumericId } from '../utils/booking';

export function useMyBookings(enabled: boolean) {
  return useQuery({
    queryKey: bookingQueryKeys.mine,
    queryFn: () => fetchMyBookings(),
    enabled,
    refetchInterval: defaultPollIntervalMs(),
    staleTime: 5000,
  });
}

export function useBooking(bookingId: number | undefined, enabled: boolean) {
  const query = useMyBookings(enabled);
  const bookings = query.data ?? [];
  const matched =
    bookings.find((booking) => {
      const nid = bookingNumericId(booking);
      return nid != null && bookingId != null && nid === bookingId;
    }) ?? null;

  return {
    booking: matched,
    isFetching: query.isFetching,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
