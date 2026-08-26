import React from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen, Building2, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { DropdownMenu } from '../ui/DropdownMenu';
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
 * Breadcrumb only renders when there is real depth (NAVIGATION.md §4) — a top-level
 * page (e.g. "Painel") shows just its own title, no "CRM Flow /" prefix.
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
  const activeTenant = tenants.find((t) => t.id === activeTenantId);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
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

        {breadcrumb?.group ? (
          <nav aria-label="Trilha de navegação" className="min-w-0 truncate text-sm">
            <span className="font-medium text-slate-400">CRM Flow</span>
            <span className="mx-1.5 text-slate-300">/</span>
            <span className="font-medium text-slate-400">{breadcrumb.group}</span>
            <span className="mx-1.5 text-slate-300">/</span>
            <span className="font-bold text-slate-800">{breadcrumb.page}</span>
          </nav>
        ) : (
          <span className="cs-text-page-title truncate text-base">{breadcrumb?.page || 'CRM Flow'}</span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {isMaster && (
          <DropdownMenu
            align="right"
            trigger={
              <Button variant="outline" size="sm" className="gap-1.5">
                <Building2 size={14} />
                <span className="max-w-[6rem] truncate sm:max-w-[10rem]">
                  {activeTenant ? activeTenant.name : 'Visão Master'}
                </span>
              </Button>
            }
            items={[
              {
                label: 'Visão Master (nenhum cliente)',
                onSelect: () => onChangeActiveTenant(null),
                icon: !activeTenantId ? <Check size={14} /> : undefined,
              },
              ...tenants.map((t) => ({
                label: t.name,
                onSelect: () => onChangeActiveTenant(t.id),
                icon: activeTenantId === t.id ? <Check size={14} /> : undefined,
              })),
            ]}
          />
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
