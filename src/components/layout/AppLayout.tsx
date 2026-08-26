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
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (currentUser && !isInitialized) {
      initializeData();
    }
  }, [currentUser, isInitialized, initializeData]);

  // Close the mobile menu on route change so it never lingers open after navigation.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // Preference persistence is optional (NAVIGATION.md §3) — safe to ignore.
      }
      return next;
    });
  };

  const isMaster = currentUser?.role === 'master';
  const tenant = tenants.find((t) => t.id === (isMaster ? activeTenantId : currentUser?.tenantId));

  // Defaults = paleta institucional Consult Services (Fase 6.5). Mesmos valores de
  // fallback usados em useApplyTenantTheme.ts — mantidos em sincronia.
  const primaryColor = tenant?.settings?.primaryColor || '#0B3A75';
  const sidebarColor = tenant?.settings?.sidebarColor || '#0B3A75';
  const sidebarTextColor = tenant?.settings?.sidebarTextColor || '#D7E7F7';

  useApplyTenantTheme({ primaryColor, sidebarColor, sidebarTextColor });

  if (!currentUser || !localStorage.getItem('token')) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (initError) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <ErrorState
            title="Erro ao carregar dados"
            description={initError}
            onRetry={handleLogout}
            retryLabel="Sair"
          />
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <LoadingState label="Carregando..." />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F1F5F9] font-sans text-slate-900">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        isMaster={isMaster}
        activeTenantId={activeTenantId}
        tenant={tenant}
        primaryColor={primaryColor}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <Header
          breadcrumb={getBreadcrumb(location.pathname)}
          isMaster={isMaster}
          tenants={tenants}
          activeTenantId={activeTenantId}
          onChangeActiveTenant={setActiveTenantId}
          currentUser={currentUser}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          sidebarCollapsed={collapsed}
          onToggleSidebar={toggleCollapsed}
        />
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
