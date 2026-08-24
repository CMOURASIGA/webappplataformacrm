import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Marks the field as invalid — pair with a visible error message (FRONTEND_SPEC §9/§11). */
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    return (
      <input
        type={type}
        aria-invalid={ariaInvalid ?? invalid ?? undefined}
        className={cn(
          'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-100',
          invalid
            ? 'border-danger-500 focus:border-danger-500 focus:ring-2 focus:ring-danger-100'
            : 'border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
