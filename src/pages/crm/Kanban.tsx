import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { AlertTriangle, Clock3, History, Phone, Plus, MessageCircle, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { AddLeadModal } from '../../components/crm/AddLeadModal';
import { LeadChatDrawer } from '../../components/crm/LeadChatDrawer';
import { fetchApi } from '../../lib/api';

export default function Kanban() {
  const currentUser = useStore(state => state.currentUser);
  const activeTenantId = useStore(state => state.activeTenantId);
  const pipelines = useStore(state => state.pipelines);
  const leads = useStore(state => state.leads);
  const moveLead = useStore(state => state.moveLead);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatLeadId, setChatLeadId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<'conversation' | 'history' | 'internal'>('conversation');
  const [serviceOverview, setServiceOverview] = useState<Record<string, any>>({});
  useEffect(() => { fetchApi('/leads/service-overview').then(setServiceOverview).catch(() => setServiceOverview({})); }, [leads.length]);
  
  if (!currentUser) return null;

  const tenantId = currentUser.role === 'master' ? activeTenantId : currentUser.tenantId;

  // For MVP, just get the first pipeline of the tenant
  const pipeline = pipelines.find(p => p.tenantId === tenantId);
  if (!pipeline) return <div>Nenhum funil encontrado.</div>;

  const tenantLeads = leads.filter(l => l.tenantId === tenantId);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    moveLead(draggableId, destination.droppableId);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-slate-700 uppercase tracking-tight">{pipeline.name} (Kanban)</h1>
        <div className="flex gap-4">
          <Button onClick={() => setIsModalOpen(true)} className="h-8 text-xs"><Plus size={14} className="mr-1" /> Adicionar lead</Button>
          <button className="text-primary-600 text-xs font-bold hover:underline">Ver Todos</button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 items-start h-full min-w-max">
            {pipeline.stages.sort((a, b) => a.order - b.order).map(stage => {
              const stageLeads = tenantLeads.filter(l => l.stageId === stage.id);
              return (
                <div key={stage.id} className="w-80 flex flex-col max-h-full gap-3 min-w-0">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stage.name}</span>
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{stageLeads.length}</span>
                  </div>
                  
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "flex-1 overflow-y-auto min-h-[150px] space-y-3 transition-colors",
                          snapshot.isDraggingOver ? "bg-slate-200/50 rounded-lg p-2 -m-2" : ""
                        )}
                      >
                        {stageLeads.map((lead, index) => (
                          // @ts-expect-error React 19 types issue with hello-pangea/dnd
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                               <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onDoubleClick={() => { setDrawerTab('conversation'); setChatLeadId(lead.id); }}
                                className={cn(
                                  "bg-white p-3 rounded-lg border shadow-sm border-l-4 select-none transition-shadow group relative",
                                  snapshot.isDragging ? "shadow-md border-primary-400 border-l-primary-500" : "border-slate-200 border-l-primary-400 hover:border-slate-300"
                                )}
                              >
                                <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button title="Abrir conversa" className="p-1 text-slate-400 hover:text-primary-600" onClick={(e) => { e.stopPropagation(); setDrawerTab('conversation'); setChatLeadId(lead.id); }}><MessageCircle size={14} /></button>
                                  <button title="Ver historico de atendimento" className="p-1 text-slate-400 hover:text-primary-600" onClick={(e) => { e.stopPropagation(); setDrawerTab('history'); setChatLeadId(lead.id); }}><History size={14} /></button>
                                  <button title="Abrir discussao interna" className="p-1 text-slate-400 hover:text-primary-600" onClick={(e) => { e.stopPropagation(); setDrawerTab('internal'); setChatLeadId(lead.id); }}><Users size={14} /></button>
                                </div>
                                <p className="text-sm font-bold truncate text-slate-900 pr-5">{lead.name}</p>
                                <p className="text-[11px] text-slate-500 mb-2">Origem: {lead.source}</p>
                                
                                {lead.tags && lead.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {lead.tags.map(tagId => {
                                      const tag = useStore.getState().tags.find(t => t.id === tagId);
                                      if (!tag) return null;
                                      return (
                                        <span key={tag.id} className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded shadow-sm" style={{ backgroundColor: tag.color }}>
                                          {tag.name}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between text-[10px] font-semibold mt-2">
                                  <span className="text-slate-500 flex items-center gap-1"><Phone size={10} /> {lead.phone}</span>
                                  <span className="text-slate-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
                                </div>
                                {serviceOverview[lead.id] && <div className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                                  {serviceOverview[lead.id].latest && <><p className="flex items-center gap-1"><Clock3 size={10} /> Ultimo: {new Date(serviceOverview[lead.id].latest.ended_at).toLocaleString()} · {serviceOverview[lead.id].latest.attendantName || 'Usuario'}</p>{serviceOverview[lead.id].latest.next_action && <p className={cn('truncate', serviceOverview[lead.id].latest.next_action_due_at && new Date(serviceOverview[lead.id].latest.next_action_due_at) < new Date() ? 'font-bold text-red-600' : 'text-slate-600')}>{serviceOverview[lead.id].latest.next_action_due_at && new Date(serviceOverview[lead.id].latest.next_action_due_at) < new Date() && <AlertTriangle size={10} className="mr-1 inline" />}Proxima: {serviceOverview[lead.id].latest.next_action}</p>}</>}
                                  {serviceOverview[lead.id].pendingCount > 0 && <p className="font-bold text-amber-700">{serviceOverview[lead.id].pendingCount} mensagens nao registradas</p>}
                                </div>}
                              </div>
                            )}
                          </Draggable>
                        ))}
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
      <AddLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <LeadChatDrawer leadId={chatLeadId} isOpen={!!chatLeadId} initialTab={drawerTab} onClose={() => setChatLeadId(null)} />
    </div>
  );
}
