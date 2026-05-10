import React from 'react';

import { normalizeStatus } from '../../utils/booking';

import type { Booking } from '../../api/bookingApi';
import Badge from '../common/Badge';

export default function BookingStatusBadge({ booking }: { booking: Booking }): JSX.Element {
  const status = normalizeStatus(booking.status);
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  const tone =
    status === 'completed'
      ? 'success'
      : status === 'cancelled'
        ? 'danger'
        : status === 'active' || status === 'confirmed'
          ? 'accent'
          : status === 'pending'
            ? 'warning'
            : 'neutral';

  return <Badge label={label} tone={tone} />;
}
