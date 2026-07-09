import { useEffect } from 'react';

export function useApplyTenantTheme(theme: {
  primaryColor?: string;
  sidebarColor?: string;
  sidebarTextColor?: string;
}) {
  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--primary-color', theme.primaryColor || '#4f46e5');
    root.style.setProperty('--sidebar-color', theme.sidebarColor || '#0F172A');
    root.style.setProperty('--sidebar-text-color', theme.sidebarTextColor || '#cbd5e1');
  }, [theme.primaryColor, theme.sidebarColor, theme.sidebarTextColor]);
}
