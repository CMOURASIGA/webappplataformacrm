import React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, 'aria-invalid': ariaInvalid, rows = 3, ...props }, ref) => {
    return (
      <textarea
        rows={rows}
        aria-invalid={ariaInvalid ?? invalid ?? undefined}
        className={cn(
          'flex w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
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
Textarea.displayName = 'Textarea';
