export function normalizeTimeInput(raw: string): string {
  const t = raw.trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!match) return t;
  const h = Number(match[1]);
  const m = match[2];
  if (!Number.isFinite(h) || h > 23) return t;
  return `${h.toString().padStart(2, '0')}:${m}`;
}

export function normalizeDateInput(raw: string): string {
  return raw.trim();
}

export function todayDateString(now = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseBookingDate(date: string, timeHHmm?: string): Date | null {
  if (!timeHHmm) {
    const d = new Date(`${date}T00:00:00`);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  const d = new Date(`${date}T${timeHHmm}:00`);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function combineDateAndTimeUtcLocal(dateYmd: string, timeHm: string): Date | null {
  return parseBookingDate(normalizeDateInput(dateYmd), normalizeTimeInput(timeHm));
}

/** Milliseconds remaining until booking start; negative once started. */
export function msUntilStart(bookingDate: string | undefined, startTime: string | undefined): number | null {
  if (!bookingDate || !startTime) return null;
  const dt = combineDateAndTimeUtcLocal(bookingDate, normalizeTimeInput(startTime));
  if (!dt) return null;
  return dt.getTime() - Date.now();
}
