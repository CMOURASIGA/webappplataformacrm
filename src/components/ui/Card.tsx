import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Renders as a button-like interactive card with hover/focus affordance (Design System §7). */
  interactive?: boolean;
  padded?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, padded = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        className={cn(
          'rounded-lg border border-[var(--consult-border)] bg-white shadow-cs-xs transition-all',
          padded && 'p-5',
          interactive && 'cs-focus-ring cursor-pointer hover:-translate-y-0.5 hover:shadow-cs-sm active:translate-y-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-3 flex items-center justify-between gap-3', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('cs-text-body font-bold text-slate-900', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('cs-text-body', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-4', className)} {...props} />;
}
