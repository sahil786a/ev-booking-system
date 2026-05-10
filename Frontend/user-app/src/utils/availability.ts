import type { AvailabilityPayload } from '../api/stationApi';

export type AvailabilityTone = 'open' | 'limited' | 'full' | 'unknown';

export function summarizeAvailability(snapshot?: AvailabilityPayload | null): {
  tone: AvailabilityTone;
  subtitle: string;
} {
  if (!snapshot) {
    return { tone: 'unknown', subtitle: 'Select to view details' };
  }

  const source = snapshot as Record<string, unknown>;

  const readBool = (key: string) => {
    const value = source[key];
    return typeof value === 'boolean' ? value : undefined;
  };

  const readNumber = (...keys: string[]) => {
    for (const key of keys) {
      const raw = source[key];
      if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    }
    return undefined;
  };

  const availableFlag = readBool('available');
  const openSlots =
    readNumber('available_slots', 'open_slots', 'free_slots', 'availableSlots') ?? null;
  const totalSlots =
    readNumber('total_slots', 'slot_count', 'totalSlots') ?? openSlots ?? null;

  const busy = Boolean(
    readBool('fully_booked') ||
      readBool('is_full') ||
      (typeof source.status === 'string' && ['full', 'unavailable'].includes(String(source.status))),
  );

  if (busy || availableFlag === false) {
    return { tone: 'full', subtitle: 'Fully booked — try another time' };
  }
  if (openSlots != null) {
    if (openSlots <= 0) {
      return { tone: 'full', subtitle: 'No open slots currently' };
    }
    const tail = totalSlots != null ? ` / ${Math.max(totalSlots, openSlots)}` : '';
    return {
      tone: openSlots <= 2 ? 'limited' : 'open',
      subtitle: `${openSlots} slots open${tail}`,
    };
  }

  const status = typeof source.status === 'string' ? source.status.toLowerCase() : null;
  if (status === 'limited') {
    return { tone: 'limited', subtitle: 'Limited availability' };
  }
  if (status === 'open' || status === 'available' || availableFlag === true) {
    return { tone: 'open', subtitle: 'Slots available' };
  }

  try {
    if (typeof snapshot.raw !== 'undefined') {
      return { tone: 'unknown', subtitle: 'Tap refresh once backend docs are synced' };
    }
  } catch {
    /* ignore */
  }

  return { tone: 'unknown', subtitle: 'Check detailed slots below' };
}
