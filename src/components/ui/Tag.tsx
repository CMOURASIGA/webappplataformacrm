import React from 'react';
import { cn } from '../../lib/utils';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Custom accent color (e.g. a tenant-defined CRM tag color). Falls back to neutral styling. */
  color?: string;
  onRemove?: () => void;
  removeLabel?: string;
}

/** Free-form, user-defined tag (as opposed to `Badge`, which represents a fixed system status). */
export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, color, children, onRemove, removeLabel = 'Remover', style, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600',
          className
        )}
        style={style}
        {...props}
      >
        {color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />}
        {children}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            className="cs-focus-ring -mr-1 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ×
          </button>
        )}
      </span>
    );
  }
);
Tag.displayName = 'Tag';
