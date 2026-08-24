import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IconButton } from './IconButton';
import { useFocusTrap } from './useFocusTrap';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Disable closing via overlay click — use for destructive flows that require an explicit choice. */
  disableOverlayClose?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

/**
 * Central modal — Design System / FRONTEND_SPEC §6: use for confirmation, deletion, critical
 * changes and short focused actions. Never for long or complex flows (use a Drawer or a page).
 */
export function Modal({ isOpen, onClose, title, description, children, footer, size = 'md', disableOverlayClose }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, isOpen);

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
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 'var(--cs-z-modal)' }}
    >
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={disableOverlayClose ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'cs-modal-title' : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-xl bg-white shadow-cs-lg outline-none',
          sizeClasses[size]
        )}
      >
        {title && (
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
            <div>
              <h2 id="cs-modal-title" className="text-lg font-bold text-slate-900">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
            </div>
            <IconButton label="Fechar" size="sm" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </div>
        )}
        <div className="overflow-y-auto p-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4">{footer}</div>}
      </div>
    </div>
  );
}
