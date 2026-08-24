import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  /** Human-readable message — never surface raw exception/stack details (FRONTEND_SPEC §14). */
  description?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Não foi possível carregar os dados',
  description = 'Ocorreu um erro inesperado. Tente novamente em instantes.',
  onRetry,
  retryLabel = 'Tentar novamente',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center gap-2 rounded-lg border border-danger-100 bg-danger-50 px-6 py-12 text-center', className)}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-danger-600">
        <AlertTriangle size={22} aria-hidden="true" />
      </span>
      <p className="text-sm font-bold text-danger-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-danger-600">{description}</p>}
      {onRetry && (
        <div className="mt-2">
          <Button variant="outline" size="sm" onClick={onRetry}>{retryLabel}</Button>
        </div>
      )}
    </div>
  );
}
