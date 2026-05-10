import React from 'react';
import { Edit2, MapPin, Phone, Trash2, Zap } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import type { Station } from '@/types';

interface StationCardProps {
  station: Station;
  onEdit: (station: Station) => void;
  onDelete: (station: Station) => void;
}

export const StationCard: React.FC<StationCardProps> = ({
  station,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="card p-5 hover:shadow-md transition-all duration-200 animate-fade-in group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Zap size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-800 leading-tight truncate max-w-[160px]">
              {station.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">ID #{station.id}</p>
          </div>
        </div>
        <Badge variant={station.is_active ? 'active' : 'inactive'} dot>
          {station.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Details */}
      <div className="space-y-2.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapPin size={13} className="shrink-0 text-slate-400" />
          <span className="font-mono text-[11px]">
            {Number(station.latitude).toFixed(4)}, {Number(station.longitude).toFixed(4)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Phone size={13} className="shrink-0 text-slate-400" />
          <span>{station.contact}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex gap-1">
            {Array.from({ length: Math.min(station.total_slots, 8) }).map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-sm bg-emerald-500/20 border border-emerald-500/30"
              />
            ))}
            {station.total_slots > 8 && (
              <span className="text-slate-400 text-[11px] ml-1 self-center">
                +{station.total_slots - 8}
              </span>
            )}
          </div>
          <span className="text-slate-500 font-medium">{station.total_slots} slots</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-slate-100">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Edit2 size={13} />}
          onClick={() => onEdit(station)}
          className="flex-1 justify-center text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 size={13} />}
          onClick={() => onDelete(station)}
          className="flex-1 justify-center text-slate-600 hover:text-red-700 hover:bg-red-50"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};
