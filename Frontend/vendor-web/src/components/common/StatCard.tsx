import React from 'react';
import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: { value: number; label: string };
  accentColor?: 'emerald' | 'blue' | 'amber' | 'red' | 'slate';
  isLoading?: boolean;
}

const accentMap = {
  emerald: 'bg-emerald-50 text-emerald-600',
  blue:    'bg-blue-50 text-blue-600',
  amber:   'bg-amber-50 text-amber-600',
  red:     'bg-red-50 text-red-600',
  slate:   'bg-slate-100 text-slate-600',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  accentColor = 'emerald',
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-10 w-10 rounded-lg" />
        </div>
        <div className="skeleton h-8 w-16" />
        <div className="skeleton h-3 w-32" />
      </div>
    );
  }

  return (
    <div className="card p-5 hover:shadow-md transition-shadow duration-200 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={cn('p-2.5 rounded-xl', accentMap[accentColor])}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
      {description && (
        <p className="text-xs text-slate-400 mt-1">{description}</p>
      )}
      {trend && (
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium',
          trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'
        )}>
          <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
          <span className="text-slate-400 font-normal">{trend.label}</span>
        </div>
      )}
    </div>
  );
};
