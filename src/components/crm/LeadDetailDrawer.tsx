import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, History, MessageCircleMore, Paperclip } from 'lucide-react';
import { useStore } from '../../store';
import { Drawer } from '../ui/Drawer';
import { Tabs } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Tag } from '../ui/Tag';
import { EmptyState } from '../ui/EmptyState';
import type { Lead } from '../../types';

type WorkspaceTab = 'conversation' | 'history' | 'discussion' | 'data';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
}

/**
 * Consulta contextual do lead — histórico consolidado, anexos, discussão interna
 * e dados cadastrais. É a abertura contextual prevista para a Fase 4; o Lead
 * Workspace completo (contexto comercial + conversa lado a lado) é escopo da Fase 5.
 */
export function LeadDetailDrawer({ lead, isOpen, onClose, onEdit }: LeadDetailDrawerProps) {
  const [tab, setTab] = useState<WorkspaceTab>('history');
  const navigate = useNavigate();
  const tags = useStore(state => state.tags);
  const internalChannels = useStore(state => state.internalChannels);
  const internalMessages = useStore(state => state.internalMessages);
  const users = useStore(state => state.users);

  if (!lead) return null;

  const leadTags = (lead.tags || []).map(id => tags.find(tag => tag.id === id)).filter(Boolean);
  const leadChannels = internalChannels.filter(channel => channel.leadId === lead.id);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={lead.name}
      description="Histórico consolidado e arquivos vinculados ao lead"
    >
      <Tabs
        className="mb-4"
        value={tab}
        onChange={value => setTab(value as WorkspaceTab)}
        items={[
          { value: 'conversation', label: 'Conversa' },
          { value: 'history', label: 'Histórico' },
          { value: 'discussion', label: 'Discussão' },
          { value: 'data', label: 'Dados' },
        ]}
      />

      {tab === 'conversation' && (
        <section className="cs-card cs-card-pad">
          <h3 className="cs-text-label">Conversa com o lead</h3>
          <p className="mt-2 cs-text-helper">Abra o atendimento para consultar mensagens, usar respostas rápidas e registrar um novo histórico.</p>
          <Button className="mt-4" onClick={() => navigate(`/chat?lead=${lead.id}`)}>Abrir atendimento</Button>
        </section>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <section className="cs-card cs-card-pad">
            <h3 className="cs-text-label flex items-center gap-2"><Paperclip size={16} /> Anexos</h3>
            {/*
              Somente leitura de propósito: lead.attachments hoje só existe no estado
              local (Zustand), sem persistência via API — some ao recarregar a página.
              Não oferecer "Adicionar"/"Remover" aqui evita sugerir uma durabilidade que
              não existe. Tratar a persistência real é dívida funcional para a Fase 5.
            */}
            <div className="mt-4 space-y-2">
              {(lead.attachments || []).map(file => (
                <div key={file.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
                  <FileText className="text-primary-500" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB, {new Date(file.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
              {!lead.attachments?.length && <p className="cs-text-helper py-4 text-center">Nenhum arquivo vinculado ainda. O upload de anexos será disponibilizado quando a persistência estiver pronta.</p>}
            </div>
          </section>
          <section className="cs-card cs-card-pad">
            <h3 className="cs-text-label flex items-center gap-2"><History size={16} /> Histórico de atendimento</h3>
            <div className="mt-4 space-y-3">
              {(lead.history || []).map(entry => (
                <div key={entry.id} className="border-l-2 border-primary-300 pl-4">
                  <div className="flex justify-between gap-3">
                    <p className="text-sm font-bold text-slate-700">{entry.title}</p>
                    <span className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{entry.content}</p>
                </div>
              ))}
              {!lead.history?.length && <p className="cs-text-helper py-4 text-center">O histórico será alimentado por resumos, notas e automações.</p>}
            </div>
          </section>
        </div>
      )}

      {tab === 'discussion' && (
        <section className="cs-card cs-card-pad">
          <h3 className="cs-text-label flex items-center gap-2"><MessageCircleMore size={16} /> Discussão interna</h3>
          {leadChannels.length === 0 ? (
            <EmptyState className="mt-4" title="Sem discussão interna" description="Ainda não existe discussão interna para este lead." />
          ) : (
            leadChannels.map(channel => (
              <div key={channel.id} className="mt-4">
                <p className="text-sm font-bold text-slate-700">{channel.name}</p>
                {internalMessages.filter(message => message.channelId === channel.id).map(message => (
                  <div key={message.id} className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">
                    <strong>{users.find(user => user.id === message.senderId)?.name}:</strong> {message.text}
                  </div>
                ))}
              </div>
            ))
          )}
          <Button className="mt-4" variant="outline" onClick={() => navigate('/chat/internal')}>Abrir chat interno</Button>
        </section>
      )}

      {tab === 'data' && (
        <section className="cs-card cs-card-pad">
          <h3 className="cs-text-label">Dados do lead</h3>
          <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-400">Nome</dt><dd className="font-semibold text-slate-800">{lead.name}</dd></div>
            <div><dt className="text-slate-400">Telefone</dt><dd className="text-slate-700">{lead.phone}</dd></div>
            <div><dt className="text-slate-400">E-mail</dt><dd className="text-slate-700">{lead.email || 'Não informado'}</dd></div>
            <div><dt className="text-slate-400">Origem</dt><dd className="text-slate-700">{lead.source}</dd></div>
            <div className="sm:col-span-2">
              <dt className="text-slate-400">Etiquetas</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {leadTags.length > 0 ? leadTags.map(tag => <Tag key={tag!.id} color={tag!.color}>{tag!.name}</Tag>) : <span className="text-slate-400">Nenhuma</span>}
              </dd>
            </div>
            <div className="sm:col-span-2"><dt className="text-slate-400">Observações</dt><dd className="text-slate-700">{lead.notes || 'Nenhuma'}</dd></div>
          </dl>
          <Button className="mt-4" onClick={() => onEdit(lead)}>Editar dados</Button>
        </section>
      )}
    </Drawer>
  );
}
