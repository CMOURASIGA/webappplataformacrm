import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/Tooltip';
import { Avatar } from '../ui/Avatar';
import { Drawer } from '../ui/Drawer';
import type { User, Tenant } from '../../types';
import { operationalNavigation, masterNavigation, type NavItemConfig } from './navigation';

const roleLabel: Record<User['role'], string> = {
  master: 'Master',
  admin: 'Administrador',
  user: 'Atendente',
};

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

function ProductIdentity({ collapsed }: { collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <div className="border-b border-white/15 px-5 py-4">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] opacity-80">CRM FLOW</div>
      <div className="mt-2 text-[15px] font-extrabold leading-snug">Gestão Comercial e Atendimento</div>
      <div className="mt-1 text-[10px] font-medium leading-snug opacity-75">Uma plataforma Consult Services Tecnologia</div>
    </div>
  );
}

function SidebarContent({ collapsed, isMaster, activeTenantId, tenant, currentUser, onLogout, onNavigate }: SidebarContentProps) {
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
    <div className="flex h-full flex-col">
      {/* Mesmo contrato visual do 7Commander: logo do cliente em uma zona branca e
          identidade do produto na zona colorida. O whitelabel nunca apaga CRM Flow /
          Consult Services, apenas personaliza a marca apresentada ao cliente. */}
      <div className={cn('shrink-0 bg-white', collapsed ? 'p-3' : 'p-4')}>
        {collapsed ? (
          <Tooltip content={`${clientName} · CRM Flow`} side="right">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5">
              <img src={logoUrl} alt={clientName} className="max-h-full max-w-full object-contain" />
            </div>
          </Tooltip>
        ) : (
          <div className="flex min-h-[92px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
            <img src={logoUrl} alt={clientName} className="max-h-16 max-w-full object-contain" />
          </div>
        )}
      </div>

      <ProductIdentity collapsed={collapsed} />

      {!collapsed && (
        <div className="border-b border-white/15 px-5 py-3">
          <div className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-60">{showClientContext ? 'Cliente' : 'Acesso'}</div>
          <div className="mt-1 truncate text-sm font-bold">{showClientContext ? clientName : 'Painel master'}</div>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Navegação principal">
        {isMaster && <NavGroup title="Master" items={masterNavigation} collapsed={collapsed} onNavigate={onNavigate} />}
        {(!isMaster || activeTenantId) && (
          <div className={cn(isMaster && 'mt-4')}>
            {filteredOperationalNav.map(group => (
              <NavGroup key={group.title} title={group.title} items={group.items} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </nav>

      <div className="mt-auto border-t border-white/15 bg-black/10 p-3">
        <div className={cn('mb-3 flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar name={currentUser.name} size="sm" className="bg-white/15 text-current" />
          {!collapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-current">{currentUser.name}</span>
              <span className="text-xs opacity-70">{roleLabel[currentUser.role]}</span>
            </div>
          )}
        </div>
        {collapsed ? (
          <Tooltip content="Sair" side="right">
            <button onClick={onLogout} aria-label="Sair" className="cs-focus-ring flex w-full items-center justify-center rounded-md py-2 opacity-80 transition-colors hover:bg-white/10 hover:opacity-100">
              <LogOut size={16} />
            </button>
          </Tooltip>
        ) : (
          <button onClick={onLogout} className="cs-focus-ring flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm opacity-80 transition-colors hover:bg-white/10 hover:opacity-100">
            <LogOut size={16} /> Sair
          </button>
        )}
      </div>
    </div>
  );
}

const NavGroup: React.FC<{ title: string; items: NavItemConfig[]; collapsed: boolean; onNavigate?: () => void }> = ({ title, items, collapsed, onNavigate }) => (
  <div className="mb-6">
    {!collapsed && <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest opacity-55">{title}</div>}
    <div className="space-y-1">
      {items.map(item => <NavItem key={item.href} to={item.href} icon={item.icon} label={item.name} collapsed={collapsed} onNavigate={onNavigate} />)}
    </div>
  </div>
);

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; collapsed: boolean; onNavigate?: () => void }> = ({ to, icon, label, collapsed, onNavigate }) => {
  const link = (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) => cn(
        'cs-focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        collapsed && 'justify-center px-2',
        isActive
          ? 'bg-[var(--brand-highlight)] font-bold text-[var(--brand-highlight-text)] shadow-sm'
          : 'text-current opacity-85 hover:bg-white/10 hover:opacity-100'
      )}
    >
      {icon}
      {!collapsed && label}
    </NavLink>
  );
  return collapsed ? <Tooltip content={label} side="right">{link}</Tooltip> : link;
};

export interface SidebarProps extends Omit<SidebarContentProps, 'onNavigate'> {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, mobileOpen, onMobileClose, ...content }: SidebarProps) {
  return (
    <>
      <aside
        className={cn('hidden shrink-0 flex-col transition-[width] duration-200 md:flex', collapsed ? 'w-[72px]' : 'w-64')}
        style={{ backgroundColor: 'var(--sidebar-color)', color: 'var(--sidebar-text-color)' }}
      >
        <SidebarContent collapsed={collapsed} {...content} />
      </aside>

      <div className="md:hidden">
        <Drawer isOpen={mobileOpen} onClose={onMobileClose} side="left" size="sm" unstyled>
          <div className="h-full" style={{ backgroundColor: 'var(--sidebar-color)', color: 'var(--sidebar-text-color)' }}>
            <SidebarContent collapsed={false} {...content} onNavigate={onMobileClose} />
          </div>
        </Drawer>
      </div>
    </>
  );
}
