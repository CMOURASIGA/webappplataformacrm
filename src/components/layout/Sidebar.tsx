import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/Tooltip';
import { Avatar } from '../ui/Avatar';
import { Drawer } from '../ui/Drawer';
import { ConsultBrandMark } from './ConsultBrandMark';
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

  // Master sem tenant selecionado não tem "cliente" para mostrar — mostra o contexto de
  // acesso (Painel master) no lugar. Em qualquer outro caso, há um tenant ativo.
  const showClientContext = !isMaster || !!activeTenantId;
  const clientName = tenant?.settings?.companyName || tenant?.name || 'Cliente';

  return (
    <div className="flex h-full flex-col">
      {/*
        Bloco de marca (Fase 6.5 — App Shell/identidade visual). A marca "Consult
        Services / CRM Flow" é fixa e sempre aparece aqui, independente de whitelabel —
        ela identifica o produto. O tenant (nome + logo do cliente, quando houver)
        aparece como um card secundário logo abaixo, nunca substituindo a marca do
        produto (ver DATA_PERSISTENCE_MAP/DESIGN_SYSTEM §3 — whitelabel convive com a
        identidade da plataforma, não a apaga).
      */}
      <div className="border-b border-white/10 p-4">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          {collapsed ? (
            <Tooltip content="CRM Flow — Consult Services" side="right">
              <ConsultBrandMark size={32} />
            </Tooltip>
          ) : (
            <ConsultBrandMark size={36} />
          )}
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[15px] font-extrabold leading-tight tracking-tight text-white">CRM FLOW</div>
              <div className="text-[11px] font-medium leading-snug text-white/70">Gestão Comercial e Atendimento</div>
            </div>
          )}
        </div>

        {!collapsed && (
          showClientContext ? (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-black/20 px-2.5 py-2">
              {tenant?.settings?.logoUrl ? (
                <img src={tenant.settings.logoUrl} alt="" className="h-5 w-5 shrink-0 rounded bg-white/90 object-contain p-0.5" />
              ) : (
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {clientName.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-white/50">Cliente</div>
                <div className="truncate text-xs font-bold text-white">{clientName}</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-md bg-black/20 px-2.5 py-2">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-white/50">Acesso</div>
              <div className="truncate text-xs font-bold text-white">Painel master</div>
            </div>
          )
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

      <div className="mt-auto border-t border-white/10 bg-black/15 p-3">
        <div className={cn('mb-3 flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar name={currentUser.name} size="sm" className="bg-white/15 text-current" />
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
              className="cs-focus-ring flex w-full items-center justify-center rounded-md py-2 opacity-80 transition-colors hover:bg-white/10 hover:opacity-100"
            >
              <LogOut size={16} />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={onLogout}
            className="cs-focus-ring flex w-full items-center gap-2 rounded px-3 py-2 text-sm opacity-80 transition-colors hover:bg-white/10 hover:opacity-100"
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
        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-white/55">{title}</div>
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
          // Item ativo: azul claro/ciano institucional (fixo, não segue whitelabel) —
          // mesmo papel do destaque do 7Commander. Ver --consult-sky/--consult-blue
          // em index.css (Fase 6.5).
          isActive
            ? 'bg-[var(--consult-sky)] font-bold text-[var(--consult-blue)] shadow-sm'
            : 'text-current opacity-80 hover:bg-white/10 hover:opacity-100'
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
 * focus-trap and z-index tokens with the rest of the app — and, since it renders the
 * exact same SidebarContent, automatically carries the same visual identity as desktop
 * (Fase 6.5 §9: sem uma segunda linguagem visual para mobile).
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
