import type { Booking, BookingStatus } from '../api/bookingApi';

export function bookingNumericId(booking: Booking): number | null {
  const raw = booking.id;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function stationLabelFromBooking(booking: Booking): string {
  if (booking.station && typeof booking.station === 'object' && booking.station.name) {
    return String(booking.station.name);
  }
  if (booking.station_id !== undefined || booking.stationId !== undefined) {
    return `Station #${booking.station_id ?? booking.stationId}`;
  }
  return 'Charging hub';
}

const ACTIVE_LIKE = new Set(['pending', 'confirmed', 'active', 'upcoming', 'booked']);

export function normalizeStatus(status?: BookingStatus): string {
  return String(status ?? 'unknown').toLowerCase();
}

export function canUserCancel(booking: Booking): boolean {
  const s = normalizeStatus(booking.status);
  return ACTIVE_LIKE.has(s);
}

export function isBookingReadOnly(booking: Booking): boolean {
  const s = normalizeStatus(booking.status);
  return ['completed', 'cancelled'].includes(s);
}
