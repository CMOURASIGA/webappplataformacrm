import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from './Card';

export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
  /** Short comparison/context line, e.g. "+12% vs. mês anterior". */
  context?: React.ReactNode;
  /** Renders as a clickable card that routes to the related operational view (Design System §7). */
  onClick?: () => void;
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
}

const toneClasses: Record<NonNullable<KpiCardProps['tone']>, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
};

export const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
  ({ icon: Icon, label, value, context, onClick, tone = 'primary', className, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        interactive={!!onClick}
        onClick={onClick}
        onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
        className={cn('flex items-start justify-between gap-4', className)}
        {...props}
      >
        <div className="min-w-0">
          <div className="cs-text-caption uppercase tracking-wide">{label}</div>
          <div className="cs-text-kpi-value mt-1">{value}</div>
          {context && <div className="mt-1 text-xs font-medium text-slate-500">{context}</div>}
        </div>
        {Icon && (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', toneClasses[tone])}>
            <Icon size={20} aria-hidden="true" />
          </span>
        )}
      </Card>
    );
  }
);
KpiCard.displayName = 'KpiCard';
