import fs from 'fs';

const content = fs.readFileSync('src/components/layout/AppLayout.tsx', 'utf-8');

const replacementStr = `
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
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium">Carregando...</p>
      </div>
    );
  }
`;

const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('if (!currentUser || !localStorage.getItem("token")) {'));
const endIdx = lines.findIndex(l => l.includes('  useApplyTenantTheme({'));
const realEndIdx = lines.findIndex((l, i) => i > endIdx && l.includes('  });'));

if (startIdx !== -1 && realEndIdx !== -1) {
    const newLines = [
        ...lines.slice(0, startIdx),
        ...replacementStr.split('\n'),
        ...lines.slice(realEndIdx + 1)
    ];
    fs.writeFileSync('src/components/layout/AppLayout.tsx', newLines.join('\n'));
    console.log("Fixed manually!");
} else {
    console.log("Indices not found");
}
