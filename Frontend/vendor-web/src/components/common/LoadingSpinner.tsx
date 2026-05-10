import React from 'react';
import { cn } from '@/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullPage?: boolean;
  label?: string;
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-7 w-7 border-2',
  lg: 'h-10 w-10 border-[3px]',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  fullPage = false,
  label,
}) => {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          'rounded-full border-slate-200 border-t-emerald-500 animate-spin',
          sizeMap[size],
          className
        )}
      />
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-40">
        {spinner}
      </div>
    );
  }

  return spinner;
};
