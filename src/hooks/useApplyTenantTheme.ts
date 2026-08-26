import { useEffect } from 'react';

const DEFAULT_PRIMARY = '#003B73';
const DEFAULT_HIGHLIGHT = '#00AEEF';

function contrastColor(hex?: string) {
  const value = (hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return '#FFFFFF';
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#0F172A' : '#FFFFFF';
}

/**
 * Aplica a identidade visual do tenant seguindo o contrato visual do 7Commander:
 * - primaryColor = cor principal da marca e fundo da navegação;
 * - sidebarColor = campo legado do CRM, usado temporariamente como cor de destaque;
 * - sidebarTextColor = mantido por compatibilidade, com contraste seguro como fallback.
 *
 * O nome legado sidebarColor permanece no modelo/API para evitar migração de banco nesta
 * etapa. Na UI ele é apresentado como "Cor de destaque" e nunca como uma segunda cor
 * independente de sidebar.
 */
export function useApplyTenantTheme(theme: {
  primaryColor?: string;
  sidebarColor?: string;
  sidebarTextColor?: string;
}) {
  useEffect(() => {
    const root = document.documentElement;
    const primary = theme.primaryColor || DEFAULT_PRIMARY;
    const highlight = theme.sidebarColor || DEFAULT_HIGHLIGHT;
    const sidebarText = theme.sidebarTextColor || contrastColor(primary);

    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--sidebar-color', primary);
    root.style.setProperty('--sidebar-text-color', sidebarText);
    root.style.setProperty('--brand-highlight', highlight);
    root.style.setProperty('--brand-highlight-text', contrastColor(highlight));
  }, [theme.primaryColor, theme.sidebarColor, theme.sidebarTextColor]);
}
