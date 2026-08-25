import React, { useRef, useState } from 'react';
import { useStore } from '../../store';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { AlertTriangle, ChevronLeft, ChevronRight, MessageCircle, Phone, Plus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Tag } from '../../components/ui/Tag';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LeadFormDrawer } from '../../components/crm/LeadFormDrawer';
import { LeadChatDrawer } from '../../components/crm/LeadChatDrawer';

export default function Kanban() {
  const currentUser = useStore(state => state.currentUser);
  const activeTenantId = useStore(state => state.activeTenantId);
  const pipelines = useStore(state => state.pipelines);
  const leads = useStore(state => state.leads);
  const tags = useStore(state => state.tags);
  const users = useStore(state => state.users);
  const moveLead = useStore(state => state.moveLead);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatLeadId, setChatLeadId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [moveError, setMoveError] = useState('');
  const [mobileStageIndex, setMobileStageIndex] = useState(0);
  const navigate = useNavigate();
  const idleRule = useStore(state => state.automations.find(rule => rule.trigger === 'stage_idle' && rule.enabled));
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef(new Map<string, HTMLDivElement>());

  if (!currentUser) return null;

  const isMaster = currentUser.role === 'master';
  const tenantId = isMaster ? activeTenantId : currentUser.tenantId;
  // Configuring a pipeline always targets a specific tenant. Admin always has one;
  // Master only has one once a client is selected in "Visão Master" — with no
  // tenant selected there is nothing concrete to configure yet.
  const canConfigurePipeline = currentUser.role === 'admin' || (isMaster && !!tenantId);

  const pipeline = pipelines.find(p => p.tenantId === tenantId);

  if (!pipeline) {
    const noTenantSelected = isMaster && !tenantId;
    return (
      <div className="cs-page">
        <PageHeader title="Funil de leads" />
        <EmptyState
          title={noTenantSelected ? 'Nenhum cliente selecionado' : 'Nenhum funil configurado'}
          description={
            noTenantSelected
              ? 'Selecione um cliente para visualizar ou configurar o funil.'
              : canConfigurePipeline
                ? 'Configure as etapas do funil comercial para começar a organizar os leads.'
                : 'O funil comercial deste cliente ainda não foi configurado. Fale com um administrador.'
          }
          action={canConfigurePipeline ? <Button size="sm" onClick={() => navigate('/settings/kanban')}>Configurar funil</Button> : undefined}
        />
      </div>
    );
  }

  const tenantLeads = leads.filter(l => l.tenantId === tenantId);
  const stages = [...pipeline.stages].sort((a, b) => a.order - b.order);
  const currentStage = stages[Math.min(mobileStageIndex, stages.length - 1)];

  const scrollToStage = (index: number) => {
    const clamped = Math.max(0, Math.min(index, stages.length - 1));
    setMobileStageIndex(clamped);
    const node = columnRefs.current.get(stages[clamped]?.id);
    node?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container || container.clientWidth === 0) return;
    // Only meaningful in the single-column mobile layout, where each column is
    // exactly the container's width — harmless no-op math on desktop's multi-column view.
    const index = Math.round(container.scrollLeft / container.clientWidth);
    setMobileStageIndex(prev => (prev === index ? prev : Math.max(0, Math.min(index, stages.length - 1))));
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    setMoveError('');
    try {
      await moveLead(draggableId, destination.droppableId);
      setFeedback('Lead movido e histórico atualizado.');
    } catch (err) {
      setMoveError(err instanceof Error ? err.message : 'Não foi possível mover o lead. Tente novamente.');
    }
  };

  const handleSelectMove = async (leadId: string, stageId: string) => {
    setMoveError('');
    try {
      await moveLead(leadId, stageId);
      setFeedback('Lead movido e histórico atualizado.');
    } catch (err) {
      setMoveError(err instanceof Error ? err.message : 'Não foi possível mover o lead. Tente novamente.');
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader
        title={`${pipeline.name} (Kanban)`}
        description={`${stages.length} etapa(s) · ${tenantLeads.length} lead(s)`}
        actions={<Button variant="outline" onClick={() => navigate('/leads')}>Ver todos</Button>}
        primaryAction={<Button onClick={() => setIsModalOpen(true)}><Plus size={16} /> Adicionar lead</Button>}
      />

      {feedback && <div className="rounded-lg border border-success-100 bg-success-50 px-3 py-2 text-sm text-success-700">{feedback}</div>}
      {moveError && <ErrorState title="Não foi possível mover o lead" description={moveError} onRetry={() => setMoveError('')} retryLabel="Entendi" />}

      {/* Mobile: uma etapa por vez, com seletor/contagem e navegação — FRONTEND_SPEC §13 */}
      <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--consult-border)] bg-white p-2 md:hidden">
        <IconButton label="Etapa anterior" size="sm" disabled={mobileStageIndex === 0} onClick={() => scrollToStage(mobileStageIndex - 1)}>
          <ChevronLeft size={18} />
        </IconButton>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          {currentStage?.name}
          <Badge variant="neutral">{tenantLeads.filter(l => l.stageId === currentStage?.id).length}</Badge>
        </div>
        <IconButton label="Próxima etapa" size="sm" disabled={mobileStageIndex === stages.length - 1} onClick={() => scrollToStage(mobileStageIndex + 1)}>
          <ChevronRight size={18} />
        </IconButton>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 snap-x snap-mandatory overflow-x-auto pb-4 md:snap-none">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex h-full min-w-max items-start gap-4">
            {stages.map(stage => {
              const stageLeads = tenantLeads.filter(l => l.stageId === stage.id);
              return (
                <div
                  key={stage.id}
                  ref={node => { if (node) columnRefs.current.set(stage.id, node); else columnRefs.current.delete(stage.id); }}
                  className="flex w-[calc(100vw-3rem)] max-w-full shrink-0 snap-start flex-col gap-3 md:w-80 md:snap-align-none"
                >
                  <div className="hidden items-center justify-between px-1 md:flex">
                    <span className="cs-text-section-title">{stage.name}</span>
                    <Badge variant="neutral">{stageLeads.length}</Badge>
                  </div>

                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          'min-h-[150px] flex-1 space-y-3 overflow-y-auto transition-colors',
                          snapshot.isDraggingOver && '-m-2 rounded-lg bg-slate-200/50 p-2'
                        )}
                      >
                        {stageLeads.length === 0 && !snapshot.isDraggingOver && (
                          <p className="cs-text-helper rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center">Nenhum lead nesta etapa.</p>
                        )}
                        {stageLeads.map((lead, index) => {
                          const assignedUser = lead.assignedTo ? users.find(u => u.id === lead.assignedTo) : undefined;
                          const isOverdue = !!(idleRule && lead.attentionSince && (Date.now() - new Date(lead.attentionSince).getTime()) / 3600000 >= (idleRule.delayHours || 24));
                          return (
                            // @ts-expect-error React 19 types issue with hello-pangea/dnd
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onDoubleClick={() => setChatLeadId(lead.id)}
                                  className={cn(
                                    'group relative select-none rounded-lg border border-l-4 bg-white p-3 shadow-cs-xs transition-shadow',
                                    snapshot.isDragging ? 'border-primary-400 border-l-primary-500 shadow-cs-sm' : 'border-slate-200 border-l-primary-400 hover:border-slate-300 hover:shadow-cs-sm'
                                  )}
                                >
                                  <IconButton
                                    label="Abrir conversa rápida"
                                    size="sm"
                                    className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={event => { event.stopPropagation(); setChatLeadId(lead.id); }}
                                  >
                                    <MessageCircle size={14} />
                                  </IconButton>

                                  <p className="truncate pr-7 text-sm font-bold text-slate-900">{lead.name}</p>
                                  <p className="mb-2 text-[11px] text-slate-500">Origem: {lead.source}</p>

                                  {isOverdue && (
                                    <div className="mb-2 flex items-center gap-1 rounded-md bg-warning-50 px-2 py-1 text-[10px] font-bold text-warning-700">
                                      <AlertTriangle size={11} /> Requer atenção, sem ação há mais de {idleRule?.delayHours || 24}h
                                    </div>
                                  )}

                                  {lead.tags && lead.tags.length > 0 && (
                                    <div className="mb-2 flex flex-wrap gap-1">
                                      {lead.tags.map(tagId => {
                                        const tag = tags.find(t => t.id === tagId);
                                        return tag ? <Tag key={tag.id} color={tag.color} className="text-[9px]">{tag.name}</Tag> : null;
                                      })}
                                    </div>
                                  )}

                                  <div className="mt-2 flex items-center justify-between text-[10px] font-semibold">
                                    <span className="flex items-center gap-1 text-slate-500"><Phone size={10} /> {lead.phone}</span>
                                    <span className="text-slate-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
                                  </div>

                                  {assignedUser && (
                                    <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                                      <User size={10} /> {assignedUser.name}
                                    </div>
                                  )}

                                  <label className="mt-3 block text-[10px] font-bold text-slate-500">
                                    Mover para
                                    <Select
                                      value={lead.stageId}
                                      onChange={event => { event.stopPropagation(); handleSelectMove(lead.id, event.target.value); }}
                                      onPointerDown={event => event.stopPropagation()}
                                      className="mt-1 h-8 text-xs font-normal"
                                    >
                                      {stages.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                                    </Select>
                                  </label>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      <LeadFormDrawer isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <LeadChatDrawer leadId={chatLeadId} isOpen={!!chatLeadId} onClose={() => setChatLeadId(null)} />
    </div>
  );
}
