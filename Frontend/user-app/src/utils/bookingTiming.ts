import { msUntilStart } from './dateFormat';

export function formatRelativeCountdown(
  bookingDate?: string,
  startTime?: string,
  _tick?: number,
): string | null {
  const ms = msUntilStart(bookingDate, startTime);
  if (ms == null) return null;
  if (ms > 0) {
    const minutes = Math.ceil(ms / 60_000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `Starts in ${hours}h ${mins.toString().padStart(2, '0')}m`;
    }
    return `Starts in ${Math.max(1, minutes)} min`;
  }
  return 'Session already started';
}

export function shouldWarnImminent(bookingDate?: string, startTime?: string): boolean {
  const ms = msUntilStart(bookingDate, startTime);
  if (ms == null) return false;
  const minutes = ms / 60_000;
  return minutes > 0 && minutes <= 30;
}
