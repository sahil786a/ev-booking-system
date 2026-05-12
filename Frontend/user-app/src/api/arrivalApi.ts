import { api } from './client';

export type ArrivalEvent = {
  id: number;
  booking_id: number;
  user_id: number;
  station_id: number;
  event_type: 'checkin' | 'checkout';
  latitude: number;
  longitude: number;
  distance_m: number;
  recorded_at: string;
};

export async function checkIn(
  bookingId: number,
  latitude: number,
  longitude: number
): Promise<{ message: string; event: ArrivalEvent; distance_m: number }> {
  const res = await api.post(`/api/arrivals/${bookingId}/checkin`, { latitude, longitude });
  return res.data;
}

export async function checkOut(
  bookingId: number,
  latitude: number,
  longitude: number
): Promise<{ message: string; event: ArrivalEvent; distance_m: number }> {
  const res = await api.post(`/api/arrivals/${bookingId}/checkout`, { latitude, longitude });
  return res.data;
}

export async function getArrivalEvents(bookingId: number): Promise<ArrivalEvent[]> {
  const res = await api.get(`/api/arrivals/${bookingId}/events`);
  return res.data.events || [];
}
