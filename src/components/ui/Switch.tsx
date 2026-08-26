import React from 'react';
import { cn } from '../../lib/utils';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  id?: string;
  name?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onChange, disabled, label, id, name }, ref) => {
    const generatedId = React.useId();
    const switchId = id ?? generatedId;
    const control = (
      <button
        ref={ref}
        id={switchId}
        type="button"
        role="switch"
        name={name}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'cs-focus-ring relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary-600' : 'bg-slate-300'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    );
    if (!label) return control;
    return (
      <label htmlFor={switchId} className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
        {control}
        {label}
      </label>
    );
  }
);
Switch.displayName = 'Switch';
