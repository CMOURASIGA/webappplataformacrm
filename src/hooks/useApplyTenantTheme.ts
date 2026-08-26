import { useEffect } from 'react';

export function useApplyTenantTheme(theme: {
  primaryColor?: string;
  sidebarColor?: string;
  sidebarTextColor?: string;
}) {
  useEffect(() => {
    const root = document.documentElement;

    // Defaults = paleta institucional Consult Services (Fase 6.5 — App Shell/identidade
    // visual). Um tenant sem whitelabel configurado deve parecer um produto da família
    // Consult Services, não um SaaS genérico de sidebar quase preta.
    root.style.setProperty('--primary-color', theme.primaryColor || '#0B3A75');
    root.style.setProperty('--sidebar-color', theme.sidebarColor || '#0B3A75');
    root.style.setProperty('--sidebar-text-color', theme.sidebarTextColor || '#D7E7F7');
  }, [theme.primaryColor, theme.sidebarColor, theme.sidebarTextColor]);
}
