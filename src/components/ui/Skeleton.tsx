import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-md bg-slate-200', className)}
      style={{ animation: 'cs-skeleton-pulse 1.5s ease-in-out infinite' }}
      aria-hidden="true"
      {...props}
    />
  );
}

export interface LoadingStateProps {
  label?: string;
  className?: string;
  /** Renders skeleton rows instead of a centered spinner — useful for tables/lists mid-fetch. */
  rows?: number;
}

export function LoadingState({ label = 'Carregando...', className, rows }: LoadingStateProps) {
  if (rows && rows > 0) {
    return (
      <div className={cn('space-y-2', className)} role="status" aria-label={label}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-12 text-center', className)} role="status" aria-label={label}>
      <Loader2 size={24} className="animate-spin text-primary-600" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
