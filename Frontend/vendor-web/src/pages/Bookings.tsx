import React, { useCallback } from 'react';
import { toast } from 'sonner';
import { BookingTable } from '@/components/bookings/BookingTable';
import { useApi } from '@/hooks/useApi';
import { bookingApi } from '@/api/bookingApi';
import type { BookingStatus } from '@/types';

const Bookings: React.FC = () => {
  const { data: bookings, isLoading, refetch } = useApi(bookingApi.getVendorBookings, []);

  const handleUpdateStatus = useCallback(async (id: number, status: BookingStatus) => {
    try {
      await bookingApi.updateStatus(id, status);
      toast.success(
        status === 'completed' ? 'Booking marked as completed' : 'Booking cancelled'
      );
      refetch();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not update booking status';
      toast.error(msg);
    }
  }, [refetch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Bookings</h1>
        <p className="page-subtitle">
          {bookings
            ? `${bookings.length} total booking${bookings.length !== 1 ? 's' : ''}`
            : 'Manage and track all station bookings'}
        </p>
      </div>

      {/* Table */}
      <BookingTable
        bookings={bookings ?? []}
        isLoading={isLoading}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

export default Bookings;
