import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Design System §6 — Primary, Secondary, Ghost, Danger. `outline` kept for backward compatibility. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks interaction to prevent double submits. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          'cs-focus-ring inline-flex items-center justify-center gap-2 rounded-md font-bold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800': variant === 'primary',
            'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300': variant === 'secondary',
            'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100': variant === 'outline',
            'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200': variant === 'ghost',
            'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-700/90': variant === 'danger',
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 py-2 text-sm': size === 'md',
            'h-11 px-8 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading && <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
