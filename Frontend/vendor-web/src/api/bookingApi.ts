import client from './client';
import type { Booking, BookingStatus } from '@/types';

export const bookingApi = {
  getVendorBookings: async (status?: BookingStatus): Promise<Booking[]> => {
    const params = status ? { status } : {};
    const { data } = await client.get<{ bookings: Booking[] }>('/api/bookings/vendor', { params });
    return data.bookings ?? [];
  },

  updateStatus: async (id: number, status: BookingStatus): Promise<Booking> => {
    const { data } = await client.patch<{ booking: Booking }>(`/api/bookings/${id}/status`, { status });
    return data.booking;
  },
};
