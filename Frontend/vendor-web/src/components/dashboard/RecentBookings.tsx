import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, formatSlot } from '@/utils/dateFormat';
import type { Booking, BookingStatus } from '@/types';
import { CalendarClock } from 'lucide-react';

interface RecentBookingsProps {
  bookings: Booking[];
  isLoading: boolean;
}

const statusToBadge: Record<BookingStatus, 'booked' | 'completed' | 'cancelled'> = {
  booked:    'booked',
  completed: 'completed',
  cancelled: 'cancelled',
};

export const RecentBookings: React.FC<RecentBookingsProps> = ({ bookings, isLoading }) => {
  const recent = bookings.slice(0, 5);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">Recent Bookings</h3>
        <Link
          to="/bookings"
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight size={13} />
        </Link>
      </div>

      {isLoading ? (
        <div className="divide-y divide-slate-50">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="skeleton h-3.5 w-32" />
                <div className="skeleton h-3 w-48" />
              </div>
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={28} />}
          title="No bookings yet"
          description="Bookings will appear here once customers start booking your stations."
        />
      ) : (
        <div className="divide-y divide-slate-50">
          {recent.map((booking) => (
            <div
              key={booking.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {booking.station_name ?? `Station #${booking.station_id}`}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatSlot(booking.slot_start, booking.slot_end)} · {formatDate(booking.created_at)}
                </p>
              </div>
              <Badge variant={statusToBadge[booking.status]} dot className="ml-4 shrink-0">
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
