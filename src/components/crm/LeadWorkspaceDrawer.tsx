import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, GitBranch } from 'lucide-react';
import { useStore } from '../../store';
import { fetchApi } from '../../lib/api';
import { Drawer } from '../ui/Drawer';
import { Tabs } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Badge, type BadgeVariant } from '../ui/Badge';
import { Tag } from '../ui/Tag';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { LoadingState } from '../ui/Skeleton';
import type { Lead } from '../../types';

type WorkspaceTab = 'conversation' | 'source-history' | 'notes' | 'data';

interface SourceHistoryEntry {
  source: string;
  source_type: 'manual' | 'automatic';
  campaign: string | null;
  source_page: string | null;
  created_at: string;
}

interface LeadWorkspaceDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
}

const classificationVariant: Record<NonNullable<Lead['classification']>, BadgeVariant> = {
  quente: 'danger',
  morno: 'warning',
  frio: 'info',
};

/**
 * Lead Workspace (Fase 5) — contexto comercial centralizado do lead.
 *
 * Segue docs/crm-flow/03-platform/DATA_PERSISTENCE_MAP.md: só promove como
 * funcionalidade oficial o que é realmente persistido pela API. Por isso:
 * - a aba "Histórico de origem" consome GET /api/leads/:id/source-history
 *   (rota já existente, dado real e auditável);
 * - lead.history (local) e a discussão interna (local) NÃO viram abas aqui —
 *   são estado de sessão, não histórico oficial do CRM. O código dessas
 *   estruturas continua existindo em store.ts por compatibilidade;
 * - anexos permanecem somente leitura (decisão da Fase 4);
 * - notas são editáveis porque lead.notes é persistido de verdade via PATCH.
 */
export function LeadWorkspaceDrawer({ lead, isOpen, onClose, onEdit }: LeadWorkspaceDrawerProps) {
  const [tab, setTab] = useState<WorkspaceTab>('data');
  const navigate = useNavigate();
  const tags = useStore(state => state.tags);
  const users = useStore(state => state.users);
  const pipelines = useStore(state => state.pipelines);
  const updateLead = useStore(state => state.updateLead);

  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  const [sourceHistory, setSourceHistory] = useState<SourceHistoryEntry[] | null>(null);
  const [sourceHistoryLoading, setSourceHistoryLoading] = useState(false);
  const [sourceHistoryError, setSourceHistoryError] = useState('');

  const leadId = lead?.id;

  useEffect(() => {
    if (!isOpen || !leadId) return;
    setTab('data');
    setNotesSaved(false);
    setNotesError('');
  }, [isOpen, leadId]);

  useEffect(() => {
    setNotes(lead?.notes || '');
  }, [lead?.id, lead?.notes]);

  const loadSourceHistory = React.useCallback(() => {
    if (!leadId) return;
    setSourceHistoryLoading(true);
    setSourceHistoryError('');
    fetchApi(`/leads/${leadId}/source-history`)
      .then(data => setSourceHistory(Array.isArray(data) ? data : []))
      .catch(err => setSourceHistoryError(err instanceof Error ? err.message : 'Não foi possível carregar o histórico de origem.'))
      .finally(() => setSourceHistoryLoading(false));
  }, [leadId]);

  useEffect(() => {
    if (!isOpen || !leadId) return;
    setSourceHistory(null);
    loadSourceHistory();
  }, [isOpen, leadId, loadSourceHistory]);

  if (!lead) return null;

  const leadTags = (lead.tags || []).map(id => tags.find(tag => tag.id === id)).filter(Boolean);
  const stage = pipelines.flatMap(p => p.stages).find(s => s.id === lead.stageId);
  const assignedUser = lead.assignedTo ? users.find(u => u.id === lead.assignedTo) : undefined;

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setNotesError('');
    setNotesSaved(false);
    try {
      await updateLead(lead.id, { notes });
      setNotesSaved(true);
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : 'Não foi possível salvar as notas.');
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={lead.name}
      description={lead.company || undefined}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {lead.classification ? (
          <Badge variant={classificationVariant[lead.classification]} className="capitalize">{lead.classification}</Badge>
        ) : (
          <Badge variant="neutral">Não classificado</Badge>
        )}
        {stage && <Badge variant="primary">{stage.name}</Badge>}
      </div>

      <dl className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-[var(--consult-border)] bg-slate-50 p-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="cs-text-caption">Responsável</dt>
          <dd className="font-semibold text-slate-800">{assignedUser?.name || 'Sem responsável'}</dd>
        </div>
        <div>
          <dt className="cs-text-caption">Origem</dt>
          <dd className="font-semibold text-slate-800">{lead.source}</dd>
        </div>
      </dl>

      <Tabs
        className="mb-4"
        value={tab}
        onChange={value => setTab(value as WorkspaceTab)}
        items={[
          { value: 'conversation', label: 'Conversa' },
          { value: 'source-history', label: 'Histórico de origem' },
          { value: 'notes', label: 'Notas' },
          { value: 'data', label: 'Dados' },
        ]}
      />

      {tab === 'conversation' && (
        <section className="cs-card cs-card-pad">
          <h3 className="cs-text-label">Conversa com o lead</h3>
          <p className="mt-2 cs-text-helper">Abra o atendimento para consultar mensagens, usar respostas rápidas e responder pelo editor.</p>
          <Button className="mt-4" onClick={() => navigate(`/chat?lead=${lead.id}`)}>Abrir atendimento</Button>
        </section>
      )}

      {tab === 'source-history' && (
        <section className="cs-card cs-card-pad">
          <h3 className="cs-text-label flex items-center gap-2"><GitBranch size={16} /> Histórico de origem</h3>
          <p className="mt-1 cs-text-helper">Registro persistido de mudanças de canal/origem deste lead — não é o histórico completo do relacionamento.</p>
          <div className="mt-4">
            {sourceHistoryLoading && <LoadingState label="Carregando histórico de origem..." rows={3} />}
            {!sourceHistoryLoading && sourceHistoryError && (
              <ErrorState title="Não foi possível carregar o histórico de origem" description={sourceHistoryError} onRetry={loadSourceHistory} />
            )}
            {!sourceHistoryLoading && !sourceHistoryError && sourceHistory && sourceHistory.length === 0 && (
              <EmptyState title="Sem mudanças de origem registradas" description="Este lead ainda não teve alteração de canal/origem." />
            )}
            {!sourceHistoryLoading && !sourceHistoryError && sourceHistory && sourceHistory.length > 0 && (
              <ul className="space-y-3">
                {sourceHistory.map((entry, index) => (
                  <li key={`${entry.created_at}-${index}`} className="border-l-2 border-primary-300 pl-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-700">{entry.source}</span>
                      <span className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {entry.source_type === 'automatic' ? 'Origem automática' : 'Origem manual'}
                      {entry.campaign ? ` · Campanha: ${entry.campaign}` : ''}
                      {entry.source_page ? ` · Página: ${entry.source_page}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {tab === 'notes' && (
        <section className="cs-card cs-card-pad">
          <h3 className="cs-text-label">Notas do lead</h3>
          <p className="mt-1 cs-text-helper">Registro manual persistido — visível para toda a equipe com acesso a este lead.</p>
          <Textarea
            className="mt-4"
            rows={6}
            value={notes}
            onChange={event => { setNotes(event.target.value); setNotesSaved(false); }}
            placeholder="Ex.: Cliente prefere contato após 14h. Decisor financeiro é o diretor Carlos."
          />
          {notesError && <p className="mt-2 text-sm text-danger-600" role="alert">{notesError}</p>}
          {notesSaved && !notesError && <p className="mt-2 text-sm text-success-600">Notas salvas.</p>}
          <Button className="mt-3" onClick={handleSaveNotes} loading={savingNotes} disabled={notes === (lead.notes || '')}>
            {savingNotes ? 'Salvando...' : 'Salvar notas'}
          </Button>
        </section>
      )}

      {tab === 'data' && (
        <div className="space-y-4">
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
            </dl>
            <Button className="mt-4" onClick={() => onEdit(lead)}>Editar dados</Button>
          </section>

          <section className="cs-card cs-card-pad">
            <h3 className="cs-text-label flex items-center gap-2"><FileText size={16} /> Anexos</h3>
            {/*
              Somente leitura de propósito — ver DATA_PERSISTENCE_MAP.md.
              lead.attachments só existe no estado local (Zustand), sem
              persistência via API. Nenhuma ação de adicionar/remover aqui.
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
        </div>
      )}
    </Drawer>
  );
}
