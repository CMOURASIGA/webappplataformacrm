import React from "react";
import { Outlet, NavLink, useNavigate, Navigate } from "react-router-dom";
import { useStore } from "../../store";
import {
  Users,
  LayoutDashboard,
  MessageSquare,
  Settings,
  LogOut,
  Building2,
  Trello,
  Smartphone,
} from "lucide-react";
import { Sparkles, Book } from "lucide-react";
import { cn } from "../../lib/utils";
import { useApplyTenantTheme } from "../../hooks/useApplyTenantTheme";
import { ContextHelp } from "./ContextHelp";

export function AppLayout() {
  const {
    currentUser,
    tenants,
    isInitialized,
    initError,
    initializeData,
    logout,
    activeTenantId,
    setActiveTenantId,
  } = useStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser && !isInitialized) {
      initializeData();
    }
  }, [currentUser, isInitialized, initializeData]);


  const isMaster = currentUser?.role === "master";
  const tenant = tenants.find(
    (t) => t.id === (isMaster ? activeTenantId : currentUser?.tenantId),
  );

  const primaryColor = tenant?.settings?.primaryColor || "#4f46e5";
  const sidebarColor = tenant?.settings?.sidebarColor || "#0F172A";
  const sidebarTextColor = tenant?.settings?.sidebarTextColor || "#cbd5e1";

  useApplyTenantTheme({
    primaryColor,
    sidebarColor,
    sidebarTextColor,
  });

  if (!currentUser || !localStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }

  // Show a loading screen while initializing
  if (initError) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 gap-4">
        <p className="text-red-500 font-bold">Erro ao carregar dados: {initError}</p>
        <button onClick={logout} className="px-4 py-2 bg-slate-200 rounded">Sair</button>
      </div>
    );
  }
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium">Carregando...</p>
      </div>
    );
  }


  const operationalNavigation = [
    {
      title: "Geral",
      items: [
        {
          name: "Painel",
          href: "/dashboard",
          icon: <LayoutDashboard size={16} />,
          adminOnly: false,
        },
      ],
    },
    {
      title: "Atendimento",
      items: [
        {
          name: "Conversas",
          href: "/chat",
          icon: <MessageSquare size={16} />,
          adminOnly: false,
        },
        {
          name: "Respostas Rápidas",
          href: "/chat/quick-replies",
          icon: <MessageSquare size={16} />,
          adminOnly: true,
        },
        {
          name: "Chat interno",
          href: "/internal-chat",
          icon: <Users size={16} />,
          adminOnly: false,
        },
      ],
    },
    {
      title: "Gestão comercial",
      items: [
        {
          name: "Funil de leads",
          href: "/crm",
          icon: <Trello size={16} />,
          adminOnly: false,
        },
        {
          name: "Lista de Leads",
          href: "/leads",
          icon: <Users size={16} />,
          adminOnly: false,
        },
        {
          name: "Configuração do funil",
          href: "/settings/kanban",
          icon: <Settings size={16} />,
          adminOnly: true,
        },
      ],
    },
    {
      title: "Configurações",
      items: [
        {
          name: "Identidade visual",
          href: "/settings",
          icon: <Settings size={16} />,
          adminOnly: true,
        },
        {
          name: "WhatsApp/Meta",
          href: "/settings/whatsapp",
          icon: <Smartphone size={16} />,
          adminOnly: true,
        },
        {
          name: "Inteligência Artificial",
          href: "/settings/ai",
          icon: <Settings size={16} />,
          adminOnly: true,
        },
      ],
    },
  ];

  const masterNavigation = [
    {
      name: "Painel master",
      href: "/master/dashboard",
      icon: <LayoutDashboard size={16} />,
    },
    {
      name: "Clientes",
      href: "/master/tenants",
      icon: <Building2 size={16} />,
    },
    {
      name: "Uso de IA",
      href: "/master/ai-usage",
      icon: <Sparkles size={16} />,
    },
  ];

  const filteredOperationalNav = operationalNavigation
    .map((group) => ({
      ...group,
      items: group.items.filter((nav) => {
        if (nav.adminOnly && currentUser.role !== "admin" && !isMaster)
          return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-full bg-[#F1F5F9] font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col transition-colors duration-300"
        style={{
          backgroundColor: "var(--sidebar-color)",
          color: "var(--sidebar-text-color)",
          borderRight: `1px solid var(--sidebar-color)`,
        }}
      >
        <div className="p-6 flex items-center gap-3 border-b border-black/10">
          {tenant?.settings?.logoUrl ? (
            <img
              src={tenant.settings.logoUrl}
              alt="Logo"
              className="h-8 max-w-[120px] object-contain"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              {isMaster ? "M" : tenant?.settings?.companyName?.charAt(0) || "C"}
            </div>
          )}
          <span className="font-bold text-white tracking-tight">
            {isMaster
              ? "Painel master"
              : tenant?.settings?.companyName || "CRM Flow"}{" "}
            <span className="text-xs font-normal opacity-50">MVP</span>
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {isMaster && (
            <>
              <div className="text-[10px] uppercase tracking-widest opacity-50 font-semibold mb-2 px-2 mt-2">
                Master
              </div>
              {masterNavigation.map((item) => (
                <NavItem
                  key={item.href}
                  to={item.href}
                  icon={item.icon}
                  label={item.name}
                />
              ))}
            </>
          )}

          {(!isMaster || activeTenantId) && (
            <div className="mt-4">
              {filteredOperationalNav.map((group, idx) => (
                <div key={idx} className="mb-6">
                  <div className="text-[10px] uppercase tracking-widest opacity-50 font-semibold mb-2 px-2">
                    {group.title}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavItem
                        key={item.href}
                        to={item.href}
                        icon={item.icon}
                        label={item.name}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </nav>

        <div className="p-4 mt-auto border-t border-black/10 bg-black/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center font-bold text-current">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-current truncate">
                {currentUser.name}
              </span>
              <span className="text-xs opacity-50 capitalize">
                {currentUser.role === "user" ? "Atendente" : currentUser.role === "admin" ? "Administrador" : "Master"}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 w-full py-2 px-3 rounded hover:bg-black/10 transition-colors"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-800">
              {/* Optional header title or context could go here */}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
              Online
            </span>
            <div className="hidden sm:block border-l border-slate-200 pl-4"><span className="block text-[10px] font-bold uppercase text-slate-400">Usuário autenticado</span><span className="block text-sm font-semibold text-slate-700">{currentUser.name}</span></div>
            {tenant && <div className="hidden md:block border-l border-slate-200 pl-4"><span className="block text-[10px] font-bold uppercase text-slate-400">Cliente ativo</span><span className="block text-sm font-semibold text-slate-700">{tenant.name}</span></div>}
          </div>

          <div className="flex items-center gap-6">
            {isMaster && (
              <div className="flex items-center">
                <span className="text-xs font-bold text-slate-500 mr-2 uppercase">
                  Cliente ativo:
                </span>
                <select
                  value={activeTenantId || ""}
                  onChange={(e) => setActiveTenantId(e.target.value || null)}
                  className="text-sm border-slate-200 rounded-md bg-slate-50 py-1.5 px-3 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">-- Visão Master --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <ContextHelp />
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const NavItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
}> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "bg-black/20 text-current font-bold"
            : "text-current opacity-80 hover:bg-black/10 hover:opacity-100",
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
};
