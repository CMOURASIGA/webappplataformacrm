import React from 'react';
import { Menu, Building2, Check, ChevronDown, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { DropdownMenu } from '../ui/DropdownMenu';
import { Avatar } from '../ui/Avatar';
import { ContextHelp } from './ContextHelp';
import type { Tenant, User } from '../../types';

const roleLabel: Record<User['role'], string> = { master: 'Master', admin: 'Administrador', user: 'Atendente' };

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
  onLogout: () => void;
}

export function Header({ breadcrumb, isMaster, tenants, activeTenantId, onChangeActiveTenant, currentUser, onOpenMobileMenu, onLogout }: HeaderProps) {
  const activeTenant = tenants.find((t) => t.id === activeTenantId);
  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <IconButton label="Abrir menu" className="md:hidden" onClick={onOpenMobileMenu}><Menu size={20} /></IconButton>
        <div className="min-w-0"><p className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-highlight)]">Gestão comercial</p><h1 className="truncate text-base font-semibold text-slate-900">{breadcrumb?.page || 'CRM Flow'}</h1></div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {isMaster && <DropdownMenu align="right" trigger={<Button variant="outline" size="sm" className="gap-1.5"><Building2 size={14} /><span className="max-w-[6rem] truncate sm:max-w-[10rem]">{activeTenant ? activeTenant.name : 'Visão Master'}</span></Button>} items={[{ label: 'Visão Master (nenhum cliente)', onSelect: () => onChangeActiveTenant(null), icon: !activeTenantId ? <Check size={14} /> : undefined }, ...tenants.map((t) => ({ label: t.name, onSelect: () => onChangeActiveTenant(t.id), icon: activeTenantId === t.id ? <Check size={14} /> : undefined }))]} />}
        <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 sm:inline-flex"><span className="h-2 w-2 rounded-full bg-emerald-500" />Sistema online</span>
        <ContextHelp />
        <DropdownMenu align="right" trigger={<button type="button" className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition hover:bg-slate-100 sm:px-2"><Avatar name={currentUser.name} size="sm" /><span className="hidden min-w-0 text-left md:block"><span className="block max-w-40 truncate text-sm font-semibold text-slate-900">{currentUser.name}</span><span className="block text-[10px] uppercase tracking-wide text-slate-500">{roleLabel[currentUser.role]}</span></span><ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" /></button>} items={[{ label: 'Sair', onSelect: onLogout, icon: <LogOut size={14} /> }]} />
      </div>
    </header>
  );
}
