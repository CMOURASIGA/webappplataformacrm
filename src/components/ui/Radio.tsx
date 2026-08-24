import React from 'react';
import { cn } from '../../lib/utils';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const input = (
      <input
        id={inputId}
        type="radio"
        ref={ref}
        className={cn(
          'cs-focus-ring h-4 w-4 shrink-0 border-slate-300 text-primary-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
    if (!label) return input;
    return (
      <label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
        {input}
        {label}
      </label>
    );
  }
);
Radio.displayName = 'Radio';
