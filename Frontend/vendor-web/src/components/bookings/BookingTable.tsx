import React, { useState } from 'react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { BookingStatusBadge } from './BookingStatusBadge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { formatDate, formatSlot } from '@/utils/dateFormat';
import type { Booking, BookingStatus } from '@/types';
import { CalendarClock } from 'lucide-react';

interface BookingTableProps {
  bookings: Booking[];
  isLoading: boolean;
  onUpdateStatus: (id: number, status: BookingStatus) => Promise<void>;
}

type FilterTab = 'all' | BookingStatus;

const TABS: { label: string; value: FilterTab }[] = [
  { label: 'All',       value: 'all' },
  { label: 'Active',    value: 'booked' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export const BookingTable: React.FC<BookingTableProps> = ({
  bookings,
  isLoading,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab]   = useState<FilterTab>('all');
  const [confirm, setConfirm]       = useState<{ id: number; status: BookingStatus } | null>(null);
  const [updating, setUpdating]     = useState<number | null>(null);

  const filtered = activeTab === 'all'
    ? bookings
    : bookings.filter((b) => b.status === activeTab);

  const handleConfirm = async () => {
    if (!confirm) return;
    setUpdating(confirm.id);
    setConfirm(null);
    try {
      await onUpdateStatus(confirm.id, confirm.status);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-5">
        {TABS.map((tab) => {
          const count = tab.value === 'all'
            ? bookings.length
            : bookings.filter((b) => b.status === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-2 ${
                activeTab === tab.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-4 w-32 ml-auto" />
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-6 w-20 rounded-full" />
                <div className="skeleton h-8 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarClock size={28} />}
            title="No bookings found"
            description={activeTab === 'all' ? 'No bookings yet.' : `No ${activeTab} bookings.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="table-th">Booking ID</th>
                  <th className="table-th">Station</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Time Slot</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => (
                  <tr key={booking.id} className="table-row">
                    <td className="table-td">
                      <span className="font-mono text-xs text-slate-500">#{booking.id}</span>
                    </td>
                    <td className="table-td font-medium text-slate-800">
                      {booking.station_name ?? `Station #${booking.station_id}`}
                    </td>
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-slate-700">{booking.user_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{booking.user_email ?? ''}</p>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-700">
                        {formatSlot(booking.slot_start, booking.slot_end)}
                      </span>
                    </td>
                    <td className="table-td text-slate-500">
                      {formatDate(booking.created_at)}
                    </td>
                    <td className="table-td">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                    <td className="table-td">
                      <div className="flex items-center justify-end gap-2">
                        {updating === booking.id ? (
                          <Loader2 size={16} className="animate-spin text-slate-400" />
                        ) : booking.status === 'booked' ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<CheckCircle size={13} />}
                              onClick={() => setConfirm({ id: booking.id, status: 'completed' })}
                              className="text-emerald-600 hover:bg-emerald-50"
                            >
                              Complete
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<XCircle size={13} />}
                              onClick={() => setConfirm({ id: booking.id, status: 'cancelled' })}
                              className="text-red-500 hover:bg-red-50"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-300 italic pr-2">No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <Modal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.status === 'completed' ? 'Mark as Completed' : 'Cancel Booking'}
        size="sm"
      >
        <p className="text-sm text-slate-600 mb-6">
          {confirm?.status === 'completed'
            ? 'Are you sure you want to mark this booking as completed?'
            : 'Are you sure you want to cancel this booking? This cannot be undone.'}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirm(null)} className="flex-1">
            Go Back
          </Button>
          <Button
            variant={confirm?.status === 'completed' ? 'primary' : 'danger'}
            onClick={handleConfirm}
            className="flex-1"
          >
            {confirm?.status === 'completed' ? 'Yes, Complete' : 'Yes, Cancel'}
          </Button>
        </div>
      </Modal>
    </>
  );
};
