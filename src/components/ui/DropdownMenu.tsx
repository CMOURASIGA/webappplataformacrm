import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IconButton } from './IconButton';

export interface DropdownMenuItem {
  label: string;
  onSelect: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  items: DropdownMenuItem[];
  trigger?: React.ReactNode;
  triggerLabel?: string;
  align?: 'left' | 'right';
}

/**
 * Contextual actions menu — Table §7: prefer this over stacking multiple row-level buttons
 * when there are more than two secondary actions.
 */
export function DropdownMenu({ items, trigger, triggerLabel = 'Mais ações', align = 'right' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      {trigger ? (
        <span onClick={() => setOpen((v) => !v)}>{trigger}</span>
      ) : (
        <IconButton label={triggerLabel} size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu">
          <MoreHorizontal size={18} />
        </IconButton>
      )}
      {open && (
        <div
          role="menu"
          style={{ zIndex: 'var(--cs-z-dropdown)' }}
          className={cn(
            'absolute mt-1 min-w-[10rem] rounded-md border border-slate-200 bg-white p-1 shadow-cs-md',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                item.danger ? 'text-danger-600 hover:bg-danger-50' : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
