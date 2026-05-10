import { api } from './client';

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | string;

export type Booking = {
  id: number | string;
  station_id?: number | string;
  stationId?: number | string;
  booking_date?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: BookingStatus;
  station?: { name?: string; address?: string; id?: number | string };
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

function unwrapList(raw: unknown): Booking[] {
  if (Array.isArray(raw)) return raw as Booking[];
  if (raw && typeof raw === 'object' && 'data' in raw) {
    return unwrapList((raw as { data: unknown }).data);
  }
  if (raw && typeof raw === 'object' && 'bookings' in raw) {
    return unwrapList((raw as { bookings: unknown }).bookings);
  }
  return [];
}

function unwrapEntity<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return unwrapEntity<T>((payload as { data: unknown }).data);
  }
  return payload as T;
}

export async function fetchMyBookings(): Promise<Booking[]> {
  const res = await api.get('/api/bookings/my');
  return unwrapList(res.data);
}

export async function createBooking(payload: {
  station_id: number;
  booking_date?: string;
  start_time?: string;
  end_time?: string;
}): Promise<Booking> {
  const res = await api.post('/api/bookings', payload);
  return unwrapEntity<Booking>(res.data);
}

export async function cancelBooking(bookingId: number): Promise<Booking> {
  const res = await api.patch(`/api/bookings/${bookingId}/cancel`);
  return unwrapEntity<Booking>(res.data);
}
