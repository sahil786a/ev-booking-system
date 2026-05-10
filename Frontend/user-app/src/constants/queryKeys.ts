export const stationQueryKeys = {
  list: ['stations'] as const,
  detail: (stationId: number) => ['station', stationId] as const,
  availability: (stationId: number, scope: Record<string, string | undefined>) =>
    ['station', stationId, 'availability', scope] as const,
};

export const bookingQueryKeys = {
  mine: ['bookings', 'mine'] as const,
  detail: (bookingId: number) => ['bookings', 'detail', bookingId] as const,
};
