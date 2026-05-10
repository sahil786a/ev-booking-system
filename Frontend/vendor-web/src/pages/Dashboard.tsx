import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentBookings } from '@/components/dashboard/RecentBookings';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { stationApi } from '@/api/stationApi';
import { bookingApi } from '@/api/bookingApi';
import { StationCard } from '@/components/stations/StationCard';
import { EmptyState } from '@/components/common/EmptyState';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { vendor } = useAuth();
  const navigate = useNavigate();

  const { data: stations, isLoading: stationsLoading } = useApi(stationApi.getMine, []);
  const { data: bookings, isLoading: bookingsLoading } = useApi(bookingApi.getVendorBookings, []);

  const isLoading = stationsLoading || bookingsLoading;

  // Build chart data: bookings per station
  const chartData = useMemo(() => {
    if (!stations || !bookings) return [];
    return stations.map((station) => ({
      name:      station.name.length > 12 ? station.name.slice(0, 12) + '…' : station.name,
      booked:    bookings.filter((b) => b.station_id === station.id && b.status === 'booked').length,
      completed: bookings.filter((b) => b.station_id === station.id && b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.station_id === station.id && b.status === 'cancelled').length,
    }));
  }, [stations, bookings]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          {greeting()}, {vendor?.name?.split(' ')[0]} 👋
        </h1>
        <p className="page-subtitle">
          Here's what's happening with your stations today.
        </p>
      </div>

      {/* Stats */}
      <DashboardStats
        stations={stations ?? []}
        bookings={bookings ?? []}
        isLoading={isLoading}
      />

      {/* Chart + Recent Bookings */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Booking Activity Chart */}
        <div className="xl:col-span-3 card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Booking Activity by Station</h3>
          {isLoading ? (
            <div className="skeleton h-52 w-full rounded-xl" />
          ) : chartData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barGap={4} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0d1117',
                    border: 'none',
                    borderRadius: 10,
                    color: '#e2e8f0',
                    fontSize: 12,
                  }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="booked"    fill="#3b82f6" radius={[4, 4, 0, 0]} name="Active" />
                <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="cancelled" fill="#ef4444" radius={[4, 4, 0, 0]} name="Cancelled" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="xl:col-span-2">
          <RecentBookings bookings={bookings ?? []} isLoading={isLoading} />
        </div>
      </div>

      {/* Quick Stations Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Your Stations</h3>
          <button
            onClick={() => navigate('/stations')}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Manage stations →
          </button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-48 rounded-xl" />
            ))}
          </div>
        ) : !stations || stations.length === 0 ? (
          <EmptyState
            icon={<MapPin size={28} />}
            title="No stations yet"
            description="Add your first EV charging station to get started."
            action={{ label: 'Add Station', onClick: () => navigate('/stations') }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.slice(0, 3).map((station) => (
              <StationCard
                key={station.id}
                station={station}
                onEdit={() => navigate('/stations')}
                onDelete={() => navigate('/stations')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
