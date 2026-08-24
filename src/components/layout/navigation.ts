import React from 'react';
import {
  Users,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Building2,
  Smartphone,
  Bot,
  UserCog,
  MessageCircleMore,
  MessageSquareText,
  KanbanSquare,
} from 'lucide-react';
import { Sparkles } from 'lucide-react';

export interface NavItemConfig {
  name: string;
  href: string;
  icon: React.ReactNode;
  /** Requires admin or master. */
  adminOnly: boolean;
}

export interface NavGroupConfig {
  title: string;
  items: NavItemConfig[];
}

/**
 * Single source of truth for the operational navigation — NAVIGATION.md §1.
 * Consumed by both the Sidebar (menu) and the Header (breadcrumb).
 * Hiding an item here is a UX convenience only; route protection (RequireRole
 * in App.tsx) is what actually enforces access — PLATFORM_RULES precedence.
 */
export const operationalNavigation: NavGroupConfig[] = [
  {
    title: 'Geral',
    items: [
      { name: 'Painel', href: '/dashboard', icon: React.createElement(LayoutDashboard, { size: 16 }), adminOnly: false },
    ],
  },
  {
    title: 'Atendimento',
    items: [
      { name: 'Conversas', href: '/chat', icon: React.createElement(MessageSquare, { size: 16 }), adminOnly: false },
      { name: 'Chat interno', href: '/chat/internal', icon: React.createElement(MessageCircleMore, { size: 16 }), adminOnly: false },
      { name: 'Respostas Rápidas', href: '/chat/quick-replies', icon: React.createElement(MessageSquareText, { size: 16 }), adminOnly: true },
    ],
  },
  {
    title: 'Gestão comercial',
    items: [
      { name: 'Funil de leads', href: '/crm', icon: React.createElement(KanbanSquare, { size: 16 }), adminOnly: false },
      { name: 'Lista de Leads', href: '/leads', icon: React.createElement(Users, { size: 16 }), adminOnly: false },
      { name: 'Configuração do funil', href: '/settings/kanban', icon: React.createElement(Settings, { size: 16 }), adminOnly: true },
      { name: 'Automações', href: '/settings/automations', icon: React.createElement(Bot, { size: 16 }), adminOnly: true },
    ],
  },
  {
    title: 'Configurações',
    items: [
      { name: 'Identidade visual', href: '/settings', icon: React.createElement(Settings, { size: 16 }), adminOnly: true },
      { name: 'Gestão de usuários', href: '/users', icon: React.createElement(UserCog, { size: 16 }), adminOnly: true },
      { name: 'WhatsApp/Meta', href: '/settings/whatsapp', icon: React.createElement(Smartphone, { size: 16 }), adminOnly: true },
      { name: 'Inteligência Artificial', href: '/settings/ai', icon: React.createElement(Settings, { size: 16 }), adminOnly: true },
    ],
  },
];

export const masterNavigation: NavItemConfig[] = [
  { name: 'Painel master', href: '/master/dashboard', icon: React.createElement(LayoutDashboard, { size: 16 }), adminOnly: false },
  { name: 'Clientes', href: '/master/tenants', icon: React.createElement(Building2, { size: 16 }), adminOnly: false },
  { name: 'Uso de IA', href: '/master/ai-usage', icon: React.createElement(Sparkles, { size: 16 }), adminOnly: false },
];

/**
 * Breadcrumb trail per route — NAVIGATION.md §4. Top-level pages (e.g. "Painel")
 * intentionally have no group and render no breadcrumb.
 */
const breadcrumbByPath: Record<string, { group?: string; page: string }> = {
  '/dashboard': { page: 'Painel' },
  '/chat': { group: 'Atendimento', page: 'Conversas' },
  '/chat/internal': { group: 'Atendimento', page: 'Chat interno' },
  '/chat/quick-replies': { group: 'Atendimento', page: 'Respostas Rápidas' },
  '/crm': { group: 'Gestão comercial', page: 'Funil de Leads' },
  '/leads': { group: 'Gestão comercial', page: 'Lista de Leads' },
  '/settings/kanban': { group: 'Gestão comercial', page: 'Configuração do funil' },
  '/settings/automations': { group: 'Gestão comercial', page: 'Automações' },
  '/settings': { group: 'Configurações', page: 'Identidade visual' },
  '/users': { group: 'Configurações', page: 'Gestão de usuários' },
  '/settings/whatsapp': { group: 'Configurações', page: 'WhatsApp/Meta' },
  '/settings/ai': { group: 'Configurações', page: 'Inteligência Artificial' },
  '/master/dashboard': { page: 'Painel master' },
  '/master/tenants': { group: 'Master', page: 'Clientes' },
  '/master/ai-usage': { group: 'Master', page: 'Uso de IA' },
};

export function getBreadcrumb(pathname: string) {
  return breadcrumbByPath[pathname];
}
