import re

with open('src/components/layout/AppLayout.tsx', 'r') as f:
    content = f.read()

target = """  React.useEffect(() => {
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

  useApplyTenantTheme({
    primaryColor,
    sidebarColor,
    sidebarTextColor
  });"""

replacement = """  React.useEffect(() => {
    if (currentUser && !isInitialized) {
      initializeData();
    }
  }, [currentUser, isInitialized, initializeData]);

  const isMaster = currentUser?.role === 'master';
  const tenant = tenants.find(t => t.id === (isMaster ? activeTenantId : currentUser?.tenantId));

  const primaryColor = tenant?.settings?.primaryColor || '#4f46e5';
  const sidebarColor = tenant?.settings?.sidebarColor || '#0F172A';
  const sidebarTextColor = tenant?.settings?.sidebarTextColor || '#cbd5e1';

  useApplyTenantTheme({
    primaryColor,
    sidebarColor,
    sidebarTextColor
  });

  if (!currentUser || !localStorage.getItem('token')) {
    return <Navigate to="/login" replace />;
  }

  // Show a loading screen while initializing
  if (!isInitialized) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500 font-medium">Carregando...</p></div>;
  }"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/layout/AppLayout.tsx', 'w') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Target not found")
