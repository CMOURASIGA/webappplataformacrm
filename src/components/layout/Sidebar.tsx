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
  /** Called when a nav link is activated — used to close the mobile drawer. */
  onNavigate?: () => void;
}

function SidebarContent({
  collapsed,
  isMaster,
  activeTenantId,
  tenant,
  primaryColor,
  currentUser,
  onLogout,
  onNavigate,
}: SidebarContentProps) {
  const filteredOperationalNav = operationalNavigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || currentUser.role === 'admin' || isMaster),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-black/10 p-4">
        {tenant?.settings?.logoUrl ? (
          <img src={tenant.settings.logoUrl} alt="Logo" className="h-8 max-w-[120px] shrink-0 object-contain" />
        ) : (
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {isMaster ? 'M' : tenant?.settings?.companyName?.charAt(0) || 'C'}
          </div>
        )}
        {!collapsed && (
          <span className="truncate font-bold tracking-tight text-white">
            {isMaster ? 'Painel master' : tenant?.settings?.companyName || 'CRM Flow'}
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Navegação principal">
        {isMaster && (
          <NavGroup title="Master" items={masterNavigation} collapsed={collapsed} onNavigate={onNavigate} />
        )}
        {(!isMaster || activeTenantId) && (
          <div className={cn(isMaster && 'mt-4')}>
            {filteredOperationalNav.map((group) => (
              <NavGroup key={group.title} title={group.title} items={group.items} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </nav>

      <div className="mt-auto border-t border-black/10 bg-black/10 p-3">
        <div className={cn('mb-3 flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar name={currentUser.name} size="sm" className="bg-black/20 text-current" />
          {!collapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-current">{currentUser.name}</span>
              <span className="text-xs capitalize opacity-70">{roleLabel[currentUser.role]}</span>
            </div>
          )}
        </div>
        {collapsed ? (
          <Tooltip content="Sair" side="right">
            <button
              onClick={onLogout}
              aria-label="Sair"
              className="cs-focus-ring flex w-full items-center justify-center rounded-md py-2 opacity-80 transition-colors hover:bg-black/10 hover:opacity-100"
            >
              <LogOut size={16} />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={onLogout}
            className="cs-focus-ring flex w-full items-center gap-2 rounded px-3 py-2 text-sm opacity-80 transition-colors hover:bg-black/10 hover:opacity-100"
          >
            <LogOut size={16} /> Sair
          </button>
        )}
      </div>
    </div>
  );
}

const NavGroup: React.FC<{
  title: string;
  items: NavItemConfig[];
  collapsed: boolean;
  onNavigate?: () => void;
}> = ({ title, items, collapsed, onNavigate }) => {
  return (
    <div className="mb-6">
      {!collapsed && (
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest opacity-50">{title}</div>
      )}
      <div className="space-y-1">
        {items.map((item) => (
          <NavItem key={item.href} to={item.href} icon={item.icon} label={item.name} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
};

const NavItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  onNavigate?: () => void;
}> = ({ to, icon, label, collapsed, onNavigate }) => {
  const link = (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'cs-focus-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          collapsed && 'justify-center px-2',
          isActive ? 'bg-black/20 font-bold text-current' : 'text-current opacity-80 hover:bg-black/10 hover:opacity-100'
        )
      }
    >
      {icon}
      {!collapsed && label}
    </NavLink>
  );

  if (!collapsed) return link;
  return (
    <Tooltip content={label} side="right">
      {link}
    </Tooltip>
  );
};

export interface SidebarProps extends Omit<SidebarContentProps, 'onNavigate'> {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

/**
 * App Shell sidebar — NAVIGATION.md §3. Desktop: persistent, collapsible to icons-only
 * with tooltips (the expand/collapse toggle itself lives in the Header, to keep the
 * sidebar's own width from having to reserve space for a floating control). Mobile/tablet:
 * off-canvas drawer reusing the Fase 1 Drawer primitive (left-anchored) so it shares
 * focus-trap and z-index tokens with the rest of the app.
 */
export function Sidebar({ collapsed, mobileOpen, onMobileClose, ...content }: SidebarProps) {
  return (
    <>
      <aside
        className={cn(
          'hidden shrink-0 flex-col transition-[width] duration-200 md:flex',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
        style={{ backgroundColor: 'var(--sidebar-color)', color: 'var(--sidebar-text-color)' }}
      >
        <SidebarContent collapsed={collapsed} {...content} />
      </aside>

      <div className="md:hidden">
        <Drawer isOpen={mobileOpen} onClose={onMobileClose} side="left" size="sm" unstyled>
          <div style={{ backgroundColor: 'var(--sidebar-color)', color: 'var(--sidebar-text-color)' }} className="h-full">
            <SidebarContent collapsed={false} {...content} onNavigate={onMobileClose} />
          </div>
        </Drawer>
      </div>
    </>
  );
}
