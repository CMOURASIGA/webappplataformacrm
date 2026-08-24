import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface FilterBarProps {
  children: React.ReactNode;
  onClear?: () => void;
  clearLabel?: string;
  className?: string;
}

/** Layout shell for search + filter controls above a table/list — pairs with `SearchField`/`Select`. */
export function FilterBar({ children, onClear, clearLabel = 'Limpar filtros', className }: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 rounded-lg border border-[var(--consult-border)] bg-white p-3', className)}>
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      {onClear && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          {clearLabel}
        </Button>
      )}
    </div>
  );
}
