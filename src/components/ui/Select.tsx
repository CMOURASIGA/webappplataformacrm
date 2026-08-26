import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, 'aria-invalid': ariaInvalid, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          aria-invalid={ariaInvalid ?? invalid ?? undefined}
          className={cn(
            'flex h-10 w-full appearance-none rounded-md border bg-white px-3 py-2 pr-9 text-sm text-slate-900 transition-colors outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
            invalid
              ? 'border-danger-500 focus:border-danger-500 focus:ring-2 focus:ring-danger-100'
              : 'border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    );
  }
);
Select.displayName = 'Select';
