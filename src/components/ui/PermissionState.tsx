import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface PermissionStateProps {
  title?: string;
  description?: React.ReactNode;
  className?: string;
}

/** ACCEPTANCE_CRITERIA §2: every data screen also needs a Permission Denied state, distinct from Error/Empty. */
export function PermissionState({
  title = 'Acesso não autorizado',
  description = 'Seu perfil não tem permissão para visualizar este conteúdo.',
  className,
}: PermissionStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-6 py-12 text-center', className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400">
        <ShieldAlert size={22} aria-hidden="true" />
      </span>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
    </div>
  );
}
