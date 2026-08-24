import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'primary';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/**
 * Status badge — Design System §8: status must be communicated with text + color, never color alone.
 * `children` should always carry the label text (e.g. "Ganho", "Em atendimento").
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
          {
            'bg-slate-100 text-slate-700': variant === 'neutral',
            'bg-info-50 text-info-700': variant === 'info',
            'bg-success-50 text-success-700': variant === 'success',
            'bg-warning-50 text-warning-700': variant === 'warning',
            'bg-danger-50 text-danger-700': variant === 'danger',
            'bg-primary-50 text-primary-700': variant === 'primary',
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
