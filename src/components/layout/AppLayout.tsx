import React from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useStore } from '../../store';
import { 
  Users, 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  LogOut,
  Building2,
  Trello,
  Smartphone
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function AppLayout() {
  const { currentUser, tenants, isInitialized, initializeData, logout, activeTenantId, setActiveTenantId } = useStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser && !isInitialized) {
      initializeData();
    }
  }, [currentUser, isInitialized, initializeData]);

  if (!currentUser || !localStorage.getItem('token')) {
    return <Navigate to="/login" replace />;
  }

  // Show a loading screen while initializing
  if (!isInitialized) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500 font-medium">Carregando...</p></div>;
  }

  const isMaster = currentUser.role === 'master';
  const tenant = tenants.find(t => t.id === (isMaster ? activeTenantId : currentUser.tenantId));
  const primaryColor = tenant?.settings?.primaryColor || '#4f46e5';
  const sidebarColor = tenant?.settings?.sidebarColor || '#0F172A';
  const sidebarTextColor = tenant?.settings?.sidebarTextColor || '#cbd5e1';

  const operationalNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={16} />, adminOnly: false },
    { name: 'Chat', href: '/chat', icon: <MessageSquare size={16} />, adminOnly: false },
    { name: 'Kanban (Leads)', href: '/crm', icon: <Trello size={16} />, adminOnly: false },
    { name: 'Configuração Kanban', href: '/settings/kanban', icon: <Settings size={16} />, adminOnly: true },
    { name: 'Leads List', href: '/leads', icon: <Users size={16} />, adminOnly: false },
    { name: 'White Label', href: '/settings', icon: <Settings size={16} />, adminOnly: true },
    { name: 'WhatsApp/Meta', href: '/settings/whatsapp', icon: <Smartphone size={16} />, adminOnly: true },
  ];

  const masterNavigation = [
    { name: 'Dashboard Master', href: '/master/dashboard', icon: <LayoutDashboard size={16} /> },
    { name: 'Tenants (Clientes)', href: '/master/tenants', icon: <Building2 size={16} /> },
  ];

  const currentOperationalNav = operationalNavigation.filter(nav => {
    if (nav.adminOnly && currentUser.role !== 'admin' && !isMaster) return false;
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full bg-[#F1F5F9] font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className="w-64 flex-shrink-0 flex flex-col transition-colors duration-300"
        style={{ 
          backgroundColor: sidebarColor, 
          color: sidebarTextColor,
          borderRight: `1px solid ${sidebarColor}`
        }}
      >
        <div className="p-6 flex items-center gap-3 border-b border-black/10">
          {tenant?.settings?.logoUrl ? (
            <img src={tenant.settings.logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
          ) : (
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              {isMaster ? 'M' : (tenant?.settings?.companyName?.charAt(0) || 'C')}
            </div>
          )}
          <span className="font-bold text-white tracking-tight">
            {isMaster ? 'Master Panel' : tenant?.settings?.companyName || 'CRM Flow'} <span className="text-xs font-normal opacity-50">MVP</span>
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {isMaster && (
            <>
              <div className="text-[10px] uppercase tracking-widest opacity-50 font-semibold mb-2 px-2 mt-2">Master</div>
              {masterNavigation.map((item) => (
                <NavItem key={item.href} to={item.href} icon={item.icon} label={item.name} />
              ))}
            </>
          )}

          {(!isMaster || activeTenantId) && (
            <>
              <div className="text-[10px] uppercase tracking-widest opacity-50 font-semibold mb-2 px-2 mt-6">
                {isMaster ? `Operacional: ${tenant?.name || ''}` : 'Principal'}
              </div>
              {currentOperationalNav.map((item) => (
                <NavItem key={item.href} to={item.href} icon={item.icon} label={item.name} />
              ))}
            </>
          )}
        </nav>

        <div className="p-4 mt-auto border-t border-black/10 bg-black/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center font-bold text-current">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-current truncate">{currentUser.name}</span>
              <span className="text-xs opacity-50 capitalize">{currentUser.role}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 w-full py-2 px-3 rounded hover:bg-black/10 transition-colors"
          >
            <LogOut size={16} /> Logout
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
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Status: Online</span>
          </div>
          
          <div className="flex items-center gap-6">
            
            {isMaster && (
              <div className="flex items-center">
                <span className="text-xs font-bold text-slate-500 mr-2 uppercase">Operar como:</span>
                <select 
                  value={activeTenantId || ''} 
                  onChange={(e) => setActiveTenantId(e.target.value || null)}
                  className="text-sm border-slate-200 rounded-md bg-slate-50 py-1.5 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Visão Master --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative hidden md:block">
              <input type="text" placeholder="Buscar..." className="w-64 pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" /> 
              <div className="absolute left-3.5 top-2.5 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const NavItem: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive ? "bg-black/20 text-current font-bold" : "text-current opacity-80 hover:bg-black/10 hover:opacity-100"
      )}
    >
      {icon}
      {label}
    </NavLink>
  );
}
