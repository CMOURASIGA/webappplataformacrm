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
  Trello
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function AppLayout() {
  const currentUser = useStore(state => state.currentUser);
  const tenants = useStore(state => state.tenants);
  const logout = useStore(state => state.logout);
  const navigate = useNavigate();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const tenant = tenants.find(t => t.id === currentUser.tenantId);
  const isMaster = currentUser.role === 'master';

  const primaryColor = tenant?.settings?.primaryColor || '#1e40af';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full bg-[#F1F5F9] font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className="w-64 flex-shrink-0 flex flex-col bg-[#0F172A] text-slate-300 transition-colors duration-300"
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: primaryColor }}
          >
            {isMaster ? 'M' : (tenant?.settings?.companyName?.charAt(0) || 'C')}
          </div>
          <span className="font-bold text-white tracking-tight">
            {isMaster ? 'Master Panel' : tenant?.settings?.companyName || 'CRM Flow'} <span className="text-xs font-normal opacity-50">MVP</span>
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 px-2 mt-2">Principal</div>
          {isMaster ? (
            <>
              <NavItem to="/master/dashboard" icon={<LayoutDashboard size={16} />} label="Dashboard" />
              <NavItem to="/master/tenants" icon={<Building2 size={16} />} label="Tenants" />
            </>
          ) : (
            <>
              <NavItem to="/dashboard" icon={<LayoutDashboard size={16} />} label="Dashboard" />
              <NavItem to="/chat" icon={<MessageSquare size={16} />} label="Chat" />
              <NavItem to="/crm" icon={<Trello size={16} />} label="Kanban (Leads)" />
              <NavItem to="/leads" icon={<Users size={16} />} label="Leads List" />
              
              {currentUser.role === 'admin' && (
                <>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 px-2 mt-6">Configurações</div>
                  <NavItem to="/settings" icon={<Settings size={16} />} label="White Label" />
                </>
              )}
            </>
          )}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-white truncate">{currentUser.name}</span>
              <span className="text-xs opacity-50 capitalize">{currentUser.role}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white w-full py-2 px-3 rounded hover:bg-slate-800 transition-colors"
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

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
      )}
    >
      {icon}
      {label}
    </NavLink>
  );
}
