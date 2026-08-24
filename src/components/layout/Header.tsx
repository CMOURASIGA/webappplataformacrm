import React from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { IconButton } from '../ui/IconButton';
import { Avatar } from '../ui/Avatar';
import { ContextHelp } from './ContextHelp';
import type { Tenant, User } from '../../types';

export interface HeaderProps {
  breadcrumb?: { group?: string; page: string };
  isMaster: boolean;
  tenants: Tenant[];
  activeTenantId: string | null;
  onChangeActiveTenant: (tenantId: string | null) => void;
  currentUser: User;
  onOpenMobileMenu: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

/**
 * App Shell header — FRONTEND_SPEC §4 / NAVIGATION.md §4: prioritizes page context
 * (breadcrumb) over administrative info; tenant selector only renders for Master.
 */
export function Header({
  breadcrumb,
  isMaster,
  tenants,
  activeTenantId,
  onChangeActiveTenant,
  currentUser,
  onOpenMobileMenu,
  sidebarCollapsed,
  onToggleSidebar,
}: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <IconButton label="Abrir menu" className="md:hidden" onClick={onOpenMobileMenu}>
          <Menu size={20} />
        </IconButton>
        <IconButton
          label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
          className="hidden md:inline-flex"
          onClick={onToggleSidebar}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </IconButton>

        {breadcrumb ? (
          <nav aria-label="Trilha de navegação" className="min-w-0 truncate text-sm">
            <span className="font-medium text-slate-400">CRM Flow</span>
            {breadcrumb.group && (
              <>
                <span className="mx-1.5 text-slate-300">/</span>
                <span className="font-medium text-slate-400">{breadcrumb.group}</span>
              </>
            )}
            <span className="mx-1.5 text-slate-300">/</span>
            <span className="font-bold text-slate-800">{breadcrumb.page}</span>
          </nav>
        ) : (
          <span className="cs-text-page-title truncate text-base">CRM Flow</span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <Badge variant="primary" className="hidden sm:inline-flex">Ambiente demonstrativo</Badge>

        {isMaster && (
          <Select
            value={activeTenantId || ''}
            onChange={(e) => onChangeActiveTenant(e.target.value || null)}
            className="hidden h-9 max-w-[12rem] sm:block"
            aria-label="Cliente ativo"
          >
            <option value="">-- Visão Master --</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        )}

        <ContextHelp />

        <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
          <Avatar name={currentUser.name} size="sm" />
          <span className="max-w-[8rem] truncate text-sm font-semibold text-slate-700">{currentUser.name}</span>
        </div>
      </div>
    </header>
  );
}
