import React from 'react';
import { cn } from '../../lib/utils';

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-[var(--consult-border)] bg-white">
      <table className={cn('w-full min-w-full border-collapse text-left text-sm', className)} {...props} />
    </div>
  );
}

export function TableHead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('sticky top-0 z-10 bg-slate-50', className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-slate-100', className)} {...props} />;
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Marks the row as navigable to a contextual detail (FRONTEND_SPEC §7). */
  clickable?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, clickable, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          'transition-colors',
          clickable && 'cs-focus-ring cursor-pointer hover:bg-slate-50',
          className
        )}
        tabIndex={clickable ? 0 : undefined}
        {...props}
      />
    );
  }
);
TableRow.displayName = 'TableRow';

export function TableHeaderCell({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn('px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500', className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-middle text-slate-700', className)} {...props} />;
}
