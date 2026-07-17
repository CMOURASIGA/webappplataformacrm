import { useState } from 'react';
import { CircleHelp, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const helpByPath: Record<string, { title: string; purpose: string; usage: string; access: string }> = {
  '/chat': { title: 'Conversas', purpose: 'Centraliza a fila e os atendimentos.', usage: 'Escolha uma conversa, assuma quando necessário e responda pelo editor.', access: 'Atendentes veem suas conversas e a fila; administradores também veem todas.' },
  '/leads': { title: 'Leads', purpose: 'Mantém os contatos e suas origens.', usage: 'Adicione ou edite um lead pela lista.', access: 'Usuários veem os leads permitidos no cliente ativo.' },
  '/crm': { title: 'Funil comercial', purpose: 'Organiza os leads por etapa.', usage: 'Arraste os cartões entre as colunas.', access: 'Usuários operacionais do cliente ativo.' },
  '/settings/kanban': { title: 'Configuração do funil', purpose: 'Define etapas e etiquetas.', usage: 'Arraste etapas para reordenar ou cadastre novas.', access: 'Administradores e master.' },
  '/chat/quick-replies': { title: 'Respostas rápidas', purpose: 'Armazena textos reutilizáveis.', usage: 'Cadastre por categoria; no chat, pesquise e insira para editar antes do envio.', access: 'Administradores cadastram; atendentes utilizam no chat.' },
};

export function ContextHelp() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const help = helpByPath[pathname] || { title: 'Ajuda da tela', purpose: 'Área de operação da plataforma.', usage: 'Use as ações disponíveis nesta tela.', access: 'O acesso depende do seu perfil e do cliente ativo.' };

  return (
    <div className="relative">
      <button onClick={() => setOpen(value => !value)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-primary-600" aria-label="Ajuda desta tela"><CircleHelp size={20} /></button>
      {open && <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"><button onClick={() => setOpen(false)} className="absolute right-3 top-3 text-slate-400" aria-label="Fechar ajuda"><X size={16} /></button><h2 className="pr-6 font-bold text-slate-800">{help.title}</h2><dl className="mt-3 space-y-2 text-xs text-slate-600"><div><dt className="font-bold text-slate-700">O que é e para que serve</dt><dd>{help.purpose}</dd></div><div><dt className="font-bold text-slate-700">Como usar</dt><dd>{help.usage}</dd></div><div><dt className="font-bold text-slate-700">Quem pode acessar</dt><dd>{help.access}</dd></div></dl></div>}
    </div>
  );
}
