import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IconButton } from './IconButton';
import { useFocusTrap } from './useFocusTrap';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Anchor edge. Defaults to 'right' (contextual editing/consulta). 'left' is used by the mobile nav drawer. */
  side?: 'left' | 'right';
  /** Omits the default padding on the body slot — used when children render their own full-bleed layout (e.g. mobile nav). */
  unstyled?: boolean;
}

const sizeClasses = {
  sm: 'w-full sm:w-96',
  md: 'w-full sm:w-[28rem]',
  lg: 'w-full sm:w-[36rem]',
};

/**
 * Side drawer — Design System / FRONTEND_SPEC §6: use for contextual editing, lead
 * lookup, tasks, notes, activities, simple registration and quick detail views.
 * Anchors right by default; `side="left"` is reserved for the mobile navigation drawer.
 */
export function Drawer({ isOpen, onClose, title, description, children, footer, size = 'md', side = 'right', unstyled = false }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/30"
        style={{ zIndex: 'var(--cs-z-overlay)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'cs-drawer-title' : undefined}
        tabIndex={-1}
        className={cn(
          'fixed inset-y-0 flex flex-col bg-white shadow-cs-lg outline-none',
          side === 'left' ? 'left-0' : 'right-0',
          sizeClasses[size]
        )}
        style={{ zIndex: 'var(--cs-z-drawer)' }}
      >
        {title && (
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/50 p-4">
            <div className="min-w-0">
              <h2 id="cs-drawer-title" className="truncate text-lg font-bold text-slate-900">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
            </div>
            <IconButton label="Fechar" size="sm" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </div>
        )}
        <div className={cn('flex-1 overflow-y-auto', !unstyled && 'p-4')}>{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-white p-4">{footer}</div>}
      </div>
    </>
  );
}
