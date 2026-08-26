import React from 'react';

/**
 * Marca da Consult Services no topo da sidebar (Fase 6.5 — identidade visual do App Shell).
 *
 * Hoje aponta para um placeholder em public/branding/consult-services-mark.svg. Quando o
 * time enviar o arquivo oficial da logo, basta substituir o conteúdo desse SVG — nenhum
 * componente React precisa mudar. Não depende de nenhuma configuração de tenant: a marca
 * do produto é fixa, ao contrário do logo do cliente (whitelabel), que aparece como
 * identidade secundária junto ao nome do tenant.
 */
export function ConsultBrandMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/branding/consult-services-mark.svg"
      alt="Consult Services"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    />
  );
}
