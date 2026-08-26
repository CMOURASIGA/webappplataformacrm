import React from 'react';

/**
 * Marca da Consult Services no topo da sidebar (Fase 6.5 — identidade visual do App Shell).
 *
 * Usa o arquivo oficial enviado pelo time (public/branding/consult-services-mark.png —
 * recorte do ícone "C" a partir da logo quadrada oficial). O arquivo original tem fundo
 * branco sólido (sem alfa), então o ícone fica dentro de um pequeno cartão branco
 * arredondado — mesmo tratamento que o 7Commander usa para a logo da Consult Services
 * (card branco sobre o azul institucional), em vez de tentar recortar o fundo e arriscar
 * artefato visual. Não depende de nenhuma configuração de tenant: a marca do produto é
 * fixa, ao contrário do logo do cliente (whitelabel), que aparece como identidade
 * secundária junto ao nome do tenant.
 */
export function ConsultBrandMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ${className}`}
      style={{ width: size, height: size, padding: Math.max(2, Math.round(size * 0.1)) }}
    >
      <img
        src="/branding/consult-services-mark.png"
        alt="Consult Services"
        className="h-full w-full object-contain"
      />
    </span>
  );
}
