import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Drawer } from '../ui/Drawer';
import type { User, Tenant } from '../../types';
import { operationalNavigation, masterNavigation, type NavItemConfig } from './navigation';

interface SidebarContentProps {
  collapsed: boolean;
  isMaster: boolean;
  activeTenantId: string | null;
  tenant: Tenant | undefined;
  primaryColor: string;
  currentUser: User;
  onLogout: () => void;
  onNavigate?: () => void;
}

function SidebarContent({ isMaster, activeTenantId, tenant, currentUser, onNavigate }: SidebarContentProps) {
  const filteredOperationalNav = operationalNavigation
    .map(group => ({
      ...group,
      items: group.items.filter(item => !item.adminOnly || currentUser.role === 'admin' || isMaster),
    }))
    .filter(group => group.items.length > 0);

  const showClientContext = !isMaster || !!activeTenantId;
  const clientName = tenant?.settings?.companyName || tenant?.name || 'Cliente';
  const logoUrl = tenant?.settings?.logoUrl || '/branding/consult-services-logo-horizontal.png';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-white/15 px-4 pb-6 pt-4">
        <div className="flex h-[144px] w-full items-center justify-center overflow-hidden rounded-xl bg-white px-2 py-2 shadow-sm">
          <img src={logoUrl} alt={clientName} className="max-h-[132px] w-[96%] object-contain object-center" />
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--brand-highlight)]">CRM FLOW</div>
            <span className="rounded-md border border-amber-300/50 bg-amber-300/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-200">Demo</span>
          </div>
          <div className="mt-1.5 text-sm font-semibold leading-5 text-white">Gestão Comercial e Atendimento</div>
        </div>
      </div>

      {showClientContext && (
        <div className="border-b border-white/15 px-4 py-3">
          <div className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-60">Cliente</div>
          <div className="mt-1 truncate text-sm font-bold">{clientName}</div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
        {isMaster && <NavGroup title="Master" items={masterNavigation} onNavigate={onNavigate} />}
        {(!isMaster || activeTenantId) && (
          <div className={cn(isMaster && 'mt-4')}>
            {filteredOperationalNav.map(group => (
              <NavGroup key={group.title} title={group.title} items={group.items} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}

const NavGroup: React.FC<{ title: string; items: NavItemConfig[]; onNavigate?: () => void }> = ({ title, items, onNavigate }) => (
  <div className="mb-5">
    <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest opacity-55">{title}</div>
    <div className="space-y-1">
      {items.map(item => <NavItem key={item.href} to={item.href} icon={item.icon} label={item.name} onNavigate={onNavigate} />)}
    </div>
  </div>
);

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; onNavigate?: () => void }> = ({ to, icon, label, onNavigate }) => (
  <NavLink
    to={to}
    onClick={onNavigate}
    className={({ isActive }) => cn(
      'cs-focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
      isActive
        ? 'bg-[var(--brand-highlight)] font-bold text-[var(--brand-highlight-text)] shadow-sm'
        : 'text-current opacity-85 hover:bg-white/10 hover:opacity-100'
    )}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

export interface SidebarProps extends Omit<SidebarContentProps, 'onNavigate'> {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose, ...content }: SidebarProps) {
  return (
    <>
      <aside
        className="hidden w-[256px] shrink-0 flex-col md:flex"
        style={{ backgroundColor: 'var(--sidebar-color)', color: 'var(--sidebar-text-color)' }}
      >
        <SidebarContent collapsed={false} {...content} />
      </aside>

      <div className="md:hidden">
        <Drawer isOpen={mobileOpen} onClose={onMobileClose} side="left" size="sm" unstyled>
          <div className="h-full w-[256px]" style={{ backgroundColor: 'var(--sidebar-color)', color: 'var(--sidebar-text-color)' }}>
            <SidebarContent collapsed={false} {...content} onNavigate={onMobileClose} />
          </div>
        </Drawer>
      </div>
    </>
  );
}
