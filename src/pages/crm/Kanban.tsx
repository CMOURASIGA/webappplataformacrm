import React, { useState } from 'react';
import { useStore } from '../../store';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Phone, Mail, Plus, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { AddLeadModal } from '../../components/crm/AddLeadModal';
import { LeadChatDrawer } from '../../components/crm/LeadChatDrawer';

export default function Kanban() {
  const currentUser = useStore(state => state.currentUser);
  const activeTenantId = useStore(state => state.activeTenantId);
  const pipelines = useStore(state => state.pipelines);
  const leads = useStore(state => state.leads);
  const moveLead = useStore(state => state.moveLead);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatLeadId, setChatLeadId] = useState<string | null>(null);
  
  if (!currentUser) return null;

  const tenantId = currentUser.role === 'master' ? activeTenantId : currentUser.tenantId;

  // For MVP, just get the first pipeline of the tenant
  const pipeline = pipelines.find(p => p.tenantId === tenantId);
  if (!pipeline) return <div>No pipeline found.</div>;

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
          <Button onClick={() => setIsModalOpen(true)} className="h-8 text-xs"><Plus size={14} className="mr-1" /> Add Lead</Button>
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
                                onDoubleClick={() => setChatLeadId(lead.id)}
                                className={cn(
                                  "bg-white p-3 rounded-lg border shadow-sm border-l-4 select-none transition-shadow group relative",
                                  snapshot.isDragging ? "shadow-md border-primary-400 border-l-primary-500" : "border-slate-200 border-l-primary-400 hover:border-slate-300"
                                )}
                              >
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-slate-400 hover:text-primary-600" onClick={(e) => { e.stopPropagation(); setChatLeadId(lead.id); }}>
                                  <MessageCircle size={14} />
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
      <LeadChatDrawer leadId={chatLeadId} isOpen={!!chatLeadId} onClose={() => setChatLeadId(null)} />
    </div>
  );
}
