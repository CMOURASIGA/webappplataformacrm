import React from 'react';
import { cn } from '../../lib/utils';
import type { ButtonVariant, ButtonSize } from './Button';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Extract<ButtonVariant, 'ghost' | 'outline' | 'primary' | 'danger'>;
  size?: ButtonSize;
  /** Accessible label — icon-only buttons must always describe their action. */
  label: string;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-11 w-11',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'md', label, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cn(
          'cs-focus-ring inline-flex items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50',
          {
            'text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200': variant === 'ghost',
            'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50': variant === 'outline',
            'bg-primary-600 text-white hover:bg-primary-700': variant === 'primary',
            'text-danger-600 hover:bg-danger-50': variant === 'danger',
          },
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';
