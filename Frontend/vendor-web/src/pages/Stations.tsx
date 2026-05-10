import React, { useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { StationCard } from '@/components/stations/StationCard';
import { StationForm } from '@/components/stations/StationForm';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { useApi } from '@/hooks/useApi';
import { stationApi } from '@/api/stationApi';
import type { Station, StationPayload } from '@/types';

const Stations: React.FC = () => {
  const { data: stations, isLoading, refetch } = useApi(stationApi.getMine, []);

  const [showForm, setShowForm]         = useState(false);
  const [editTarget, setEditTarget]     = useState<Station | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Station | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting]     = useState(false);

  const openAdd = () => {
    setEditTarget(null);
    setShowForm(true);
  };

  const openEdit = (station: Station) => {
    setEditTarget(station);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  const handleSubmit = async (payload: StationPayload) => {
    setIsSubmitting(true);
    try {
      if (editTarget) {
        await stationApi.update(editTarget.id, payload);
        toast.success('Station updated successfully');
      } else {
        await stationApi.create(payload);
        toast.success('Station added successfully');
      }
      refetch();
      closeForm();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Something went wrong';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await stationApi.delete(deleteTarget.id);
      toast.success('Station deleted');
      refetch();
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not delete station';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="page-header mb-0">
            <h1 className="page-title">Stations</h1>
            <p className="page-subtitle">
              {stations ? `${stations.length} station${stations.length !== 1 ? 's' : ''}` : 'Manage your charging stations'}
            </p>
          </div>
          <Button variant="primary" leftIcon={<Plus size={15} />} onClick={openAdd}>
            Add Station
          </Button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-52 rounded-xl" />
            ))}
          </div>
        ) : !stations || stations.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<MapPin size={28} />}
              title="No stations yet"
              description="Add your first EV charging station to start accepting bookings."
              action={{ label: 'Add your first station', icon: <Plus size={15} />, onClick: openAdd }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {stations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editTarget ? 'Edit Station' : 'Add New Station'}
        description={editTarget ? 'Update your station details below.' : 'Fill in the details to add a new charging station.'}
      >
        <StationForm
          defaultValues={editTarget}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Station"
        size="sm"
      >
        <p className="text-sm text-slate-600 mb-2">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-slate-800">{deleteTarget?.name}</span>?
        </p>
        <p className="text-xs text-slate-400 mb-6">
          This action will deactivate the station. Existing bookings will remain.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} className="flex-1" disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isDeleting} className="flex-1">
            Delete Station
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default Stations;
