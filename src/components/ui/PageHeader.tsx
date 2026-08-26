import React from 'react';
import { cn } from '../../lib/utils';

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Secondary actions (filters, import, etc.). */
  actions?: React.ReactNode;
  /** Single dominant primary action (Design System §6: at most one primary action per block). */
  primaryAction?: React.ReactNode;
  className?: string;
}

/** Official page header — FRONTEND_SPEC §5 / GAP GF-04. */
export function PageHeader({ title, description, actions, primaryAction, className }: PageHeaderProps) {
  return (
    <div className={cn('cs-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="cs-text-page-title truncate">{title}</h1>
        {description && <p className="cs-subtitle">{description}</p>}
      </div>
      {(actions || primaryAction) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
          {primaryAction}
        </div>
      )}
    </div>
  );
}
