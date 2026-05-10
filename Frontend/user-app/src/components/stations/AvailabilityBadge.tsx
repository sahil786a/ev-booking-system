import React, { useMemo } from 'react';

import type { AvailabilityPayload } from '../../api/stationApi';
import { summarizeAvailability } from '../../utils/availability';

import Badge from '../common/Badge';

export default function AvailabilityBadge({
  snapshot,
  fallbackLabel,
}: {
  snapshot?: AvailabilityPayload | null;
  fallbackLabel?: string;
}): JSX.Element {
  const { tone, subtitle } = useMemo(
    () => summarizeAvailability(snapshot ?? undefined),
    [snapshot],
  );

  const badgeTone =
    tone === 'open' ? 'success' : tone === 'limited' ? 'warning' : tone === 'full' ? 'danger' : 'neutral';

  const label =
    tone === 'unknown' && fallbackLabel
      ? fallbackLabel
      : tone === 'unknown'
        ? 'Availability updating'
        : subtitle;

  return <Badge label={label} tone={badgeTone} />;
}
