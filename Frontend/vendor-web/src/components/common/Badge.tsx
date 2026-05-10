import React from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'booked' | 'completed' | 'cancelled' | 'active' | 'inactive' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  booked:    'bg-blue-50 text-blue-700 border border-blue-100',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  cancelled: 'bg-red-50 text-red-600 border border-red-100',
  active:    'bg-emerald-50 text-emerald-700 border border-emerald-100',
  inactive:  'bg-slate-100 text-slate-500 border border-slate-200',
  default:   'bg-slate-100 text-slate-600 border border-slate-200',
};

const dotStyles: Record<BadgeVariant, string> = {
  booked:    'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
  active:    'bg-emerald-500',
  inactive:  'bg-slate-400',
  default:   'bg-slate-400',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className,
  dot = false,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotStyles[variant])} />
      )}
      {children}
    </span>
  );
};
