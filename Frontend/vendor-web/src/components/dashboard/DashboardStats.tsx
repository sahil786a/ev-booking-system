import React from 'react';
import { CalendarClock, CheckCircle, MapPin, XCircle } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import type { Booking, Station } from '@/types';

interface DashboardStatsProps {
  stations: Station[];
  bookings: Booking[];
  isLoading: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stations,
  bookings,
  isLoading,
}) => {
  const activeBookings    = bookings.filter((b) => b.status === 'booked').length;
  const completedBookings = bookings.filter((b) => b.status === 'completed').length;
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled').length;
  const activeStations    = stations.filter((s) => s.is_active).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Total Stations"
        value={isLoading ? '—' : stations.length}
        icon={<MapPin size={18} />}
        description={`${activeStations} active stations`}
        accentColor="emerald"
        isLoading={isLoading}
      />
      <StatCard
        title="Active Bookings"
        value={isLoading ? '—' : activeBookings}
        icon={<CalendarClock size={18} />}
        description="Currently booked slots"
        accentColor="blue"
        isLoading={isLoading}
      />
      <StatCard
        title="Completed"
        value={isLoading ? '—' : completedBookings}
        icon={<CheckCircle size={18} />}
        description="Successfully completed"
        accentColor="slate"
        isLoading={isLoading}
      />
      <StatCard
        title="Cancelled"
        value={isLoading ? '—' : cancelledBookings}
        icon={<XCircle size={18} />}
        description="Cancelled bookings"
        accentColor="red"
        isLoading={isLoading}
      />
    </div>
  );
};
