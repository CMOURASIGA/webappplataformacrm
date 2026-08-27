import React from "react";
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useStore } from "../../store";
import {
  Users, LayoutDashboard, MessageSquare, Settings, Building2, Smartphone, Bot, UserCog,
  MessageCircleMore, MessageSquareText, KanbanSquare, Sparkles, Menu, ChevronDown, LogOut,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useApplyTenantTheme } from "../../hooks/useApplyTenantTheme";
import { ContextHelp } from "./ContextHelp";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Painel", chat: "Conversas", crm: "Funil de leads", leads: "Lista de Leads",
  settings: "Configurações", users: "Gestão de usuários", master: "Painel master",
};

export function AppLayout() {
  const { currentUser, tenants, isInitialized, initError, initializeData, logout, activeTenantId, setActiveTenantId } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { if (currentUser && !isInitialized) initializeData(); }, [currentUser, isInitialized, initializeData]);
  React.useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);
  React.useEffect(() => {
    const close = (event: MouseEvent) => { if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setUserMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const isMaster = currentUser?.role === "master";
  const tenant = tenants.find((t) => t.id === (isMaster ? activeTenantId : currentUser?.tenantId));
  const primaryColor = tenant?.settings?.primaryColor || "#0B3A75";
  const sidebarColor = tenant?.settings?.sidebarColor || "#0B3A75";
  const sidebarTextColor = tenant?.settings?.sidebarTextColor || "#D7E7F7";
  useApplyTenantTheme({ primaryColor, sidebarColor, sidebarTextColor });

  if (!currentUser || !localStorage.getItem("token")) return <Navigate to="/login" replace />;
  if (initError) return <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50"><p className="font-bold text-red-500">Erro ao carregar dados: {initError}</p><button onClick={logout} className="rounded bg-slate-200 px-4 py-2">Sair</button></div>;
  if (!isInitialized) return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="font-medium text-slate-500">Carregando...</p></div>;

  const operationalNavigation = [
    { title: "Geral", items: [{ name: "Painel", href: "/dashboard", icon: <LayoutDashboard size={16} />, adminOnly: false }] },
    { title: "Atendimento", items: [
      { name: "Conversas", href: "/chat", icon: <MessageSquare size={16} />, adminOnly: false },
      { name: "Chat interno", href: "/chat/internal", icon: <MessageCircleMore size={16} />, adminOnly: false },
      { name: "Respostas Rápidas", href: "/chat/quick-replies", icon: <MessageSquareText size={16} />, adminOnly: true },
    ]},
    { title: "Gestão comercial", items: [
      { name: "Funil de leads", href: "/crm", icon: <KanbanSquare size={16} />, adminOnly: false },
      { name: "Lista de Leads", href: "/leads", icon: <Users size={16} />, adminOnly: false },
      { name: "Configuração do funil", href: "/settings/kanban", icon: <Settings size={16} />, adminOnly: true },
      { name: "Automações", href: "/settings/automations", icon: <Bot size={16} />, adminOnly: true },
    ]},
    { title: "Configurações", items: [
      { name: "Identidade visual", href: "/settings", icon: <Settings size={16} />, adminOnly: true },
      { name: "Gestão de usuários", href: "/users", icon: <UserCog size={16} />, adminOnly: true },
      { name: "WhatsApp/Meta", href: "/settings/whatsapp", icon: <Smartphone size={16} />, adminOnly: true },
      { name: "Inteligência Artificial", href: "/settings/ai", icon: <Settings size={16} />, adminOnly: true },
    ]},
  ];
  const masterNavigation = [
    { name: "Painel master", href: "/master/dashboard", icon: <LayoutDashboard size={16} /> },
    { name: "Clientes", href: "/master/tenants", icon: <Building2 size={16} /> },
    { name: "Uso de IA", href: "/master/ai-usage", icon: <Sparkles size={16} /> },
  ];
  const filteredOperationalNav = operationalNavigation.map((group) => ({ ...group, items: group.items.filter((nav) => !nav.adminOnly || currentUser.role === "admin" || isMaster) })).filter((group) => group.items.length > 0);
  const handleLogout = () => { logout(); navigate("/login"); };
  const clientName = tenant?.settings?.companyName || tenant?.name || "Consult Services";
  const logoUrl = tenant?.settings?.logoUrl || "https://i.imgur.com/gxXnYsA.png";
  const initials = currentUser.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "US";
  const pathRoot = location.pathname.split("/").filter(Boolean)[0] || "dashboard";
  const pageTitle = PAGE_TITLES[pathRoot] || "CRM Flow";
  const roleLabel = currentUser.role === "user" ? "Atendente" : currentUser.role === "admin" ? "Administrador" : "Master";

  const sidebar = (
    <div className="flex h-full flex-col overflow-hidden" style={{ backgroundColor: "var(--sidebar-color)", color: "var(--sidebar-text-color)" }}>
      <div className="shrink-0 border-b border-white/15 px-4 pb-6 pt-4">
        <div className="flex h-[144px] w-full items-center justify-center overflow-hidden rounded-xl bg-white px-2 py-2 shadow-sm"><img src={logoUrl} alt={clientName} className="max-h-[132px] w-[96%] object-contain object-center" /></div>
        <div className="mt-6"><div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--brand-highlight)]">CRM FLOW</div><div className="mt-1.5 text-sm font-semibold leading-5 text-white">Gestão Comercial e Atendimento</div></div>
      </div>
      {tenant && <div className="border-b border-white/15 px-4 py-3"><div className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-60">Cliente</div><div className="mt-1 truncate text-sm font-bold">{clientName}</div></div>}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {isMaster && <div className="mb-5"><div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest opacity-55">Master</div><div className="space-y-1">{masterNavigation.map((item) => <NavItem key={item.href} to={item.href} icon={item.icon} label={item.name} />)}</div></div>}
        {(!isMaster || activeTenantId) && filteredOperationalNav.map((group) => <div key={group.title} className="mb-5"><div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest opacity-55">{group.title}</div><div className="space-y-1">{group.items.map((item) => <NavItem key={item.href} to={item.href} icon={item.icon} label={item.name} />)}</div></div>)}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F1F5F9] font-sans text-slate-900">
      {mobileMenuOpen && <button type="button" aria-label="Fechar menu" className="fixed inset-0 z-40 bg-slate-950/45 md:hidden" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[256px] shrink-0 transition-transform md:relative md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>{sidebar}</aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => setMobileMenuOpen(true)} className="rounded-xl border border-slate-200 p-2 text-slate-600 md:hidden" aria-label="Abrir menu"><Menu size={20} /></button><div className="min-w-0"><p className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-highlight)]">Gestão comercial</p><h1 className="truncate text-base font-semibold text-slate-900">{pageTitle}</h1></div></div>
          <div className="flex items-center gap-2 sm:gap-3">
            {isMaster && <select value={activeTenantId || ""} onChange={(e) => setActiveTenantId(e.target.value || null)} className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm lg:block"><option value="">Visão Master</option>{tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}
            <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 sm:inline-flex"><span className="h-2 w-2 rounded-full bg-emerald-500" />Sistema online</span>
            <ContextHelp />
            <div ref={userMenuRef} className="relative"><button type="button" onClick={() => setUserMenuOpen((open) => !open)} className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition hover:bg-slate-100 sm:px-2"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-highlight)] text-xs font-bold text-slate-950">{initials}</span><span className="hidden min-w-0 text-left md:block"><span className="block max-w-40 truncate text-sm font-semibold text-slate-900">{currentUser.name}</span><span className="block text-[10px] uppercase tracking-wide text-slate-500">{roleLabel}</span></span><ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" /></button>{userMenuOpen && <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"><div className="border-b border-slate-100 px-4 py-4"><p className="truncate text-sm font-semibold text-slate-900">{currentUser.name}</p><p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{roleLabel}</p></div><div className="p-2"><button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"><LogOut size={14} />Sair</button></div></div>}</div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6"><Outlet /></div>
      </main>
    </div>
  );
}

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
  <NavLink to={to} className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors", isActive ? "bg-[var(--brand-highlight)] font-bold text-[var(--brand-highlight-text)] shadow-sm" : "text-current opacity-85 hover:bg-white/10 hover:opacity-100")}>{icon}<span>{label}</span></NavLink>
);
