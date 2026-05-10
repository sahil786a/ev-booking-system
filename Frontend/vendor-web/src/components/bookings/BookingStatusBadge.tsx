import React from 'react';
import { Badge } from '@/components/common/Badge';
import type { BookingStatus } from '@/types';

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

const labelMap: Record<BookingStatus, string> = {
  booked:    'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({ status }) => {
  return (
    <Badge variant={status} dot>
      {labelMap[status]}
    </Badge>
  );
};
