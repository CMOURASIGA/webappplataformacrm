import React from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name?: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

function initials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (first + last).toUpperCase() || '?';
}

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ name, src, size = 'md', className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 font-bold text-primary-700',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={name || 'Avatar'} className="h-full w-full object-cover" />
        ) : (
          initials(name)
        )}
      </span>
    );
  }
);
Avatar.displayName = 'Avatar';
