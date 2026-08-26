import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useStore } from '../../store';
import { useApplyTenantTheme } from '../../hooks/useApplyTenantTheme';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { getBreadcrumb } from './navigation';
import { LoadingState } from '../ui/Skeleton';
import { ErrorState } from '../ui/ErrorState';

const SIDEBAR_COLLAPSED_KEY = 'crm-flow:sidebar-collapsed';

export function AppLayout() {
  const { currentUser, tenants, isInitialized, initError, initializeData, logout, activeTenantId, setActiveTenantId } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'; } catch { return false; } });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { if (currentUser && !isInitialized) initializeData(); }, [currentUser, isInitialized, initializeData]);
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const toggleCollapsed = () => setCollapsed(prev => { const next = !prev; try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)); } catch {} return next; });
  const isMaster = currentUser?.role === 'master';
  const tenant = tenants.find(t => t.id === (isMaster ? activeTenantId : currentUser?.tenantId));
  const primaryColor = tenant?.settings?.primaryColor || '#003B73';
  const highlightColor = tenant?.settings?.sidebarColor || '#00AEEF';
  const sidebarTextColor = tenant?.settings?.sidebarTextColor || '#FFFFFF';
  useApplyTenantTheme({ primaryColor, sidebarColor: highlightColor, sidebarTextColor });

  if (!currentUser || !localStorage.getItem('token')) return <Navigate to="/login" replace />;
  const handleLogout = () => { logout(); navigate('/login'); };
  const restoreDemo = () => {
    const user = currentUser;
    localStorage.removeItem('crm-demo-storage');
    localStorage.removeItem('activeTenantId');
    localStorage.removeItem(SIDEBAR_COLLAPSED_KEY);
    localStorage.setItem('token', `demo-${user.id}`);
    window.location.href = '/dashboard';
  };

  if (initError) return <div className="flex h-screen items-center justify-center bg-slate-50 p-6"><div className="w-full max-w-md"><ErrorState title="Erro ao carregar dados" description={initError} onRetry={handleLogout} retryLabel="Sair" /></div></div>;
  if (!isInitialized) return <div className="flex h-screen items-center justify-center bg-slate-50"><LoadingState label="Carregando demonstração..." /></div>;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F1F5F9] font-sans text-slate-900">
      <Sidebar collapsed={collapsed} mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} isMaster={isMaster} activeTenantId={activeTenantId} tenant={tenant} primaryColor={primaryColor} currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex min-w-0 flex-1 flex-col">
        <Header breadcrumb={getBreadcrumb(location.pathname)} isMaster={isMaster} tenants={tenants} activeTenantId={activeTenantId} onChangeActiveTenant={setActiveTenantId} currentUser={currentUser} onOpenMobileMenu={() => setMobileMenuOpen(true)} sidebarCollapsed={collapsed} onToggleSidebar={toggleCollapsed} />
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200 bg-sky-50 px-4 py-2 text-xs text-sky-900">
          <span><strong className="uppercase tracking-wider">Modo demonstração</strong> · dados fictícios salvos somente neste navegador.</span>
          <button type="button" onClick={restoreDemo} className="font-semibold underline underline-offset-2 hover:no-underline">Restaurar dados iniciais</button>
        </div>
        <div className="flex-1 overflow-auto p-6"><Outlet /></div>
      </main>
    </div>
  );
}
