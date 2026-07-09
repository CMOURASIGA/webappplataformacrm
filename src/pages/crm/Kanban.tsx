import React from 'react';
import { useStore } from '../../store';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Phone, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Kanban() {
  const currentUser = useStore(state => state.currentUser);
  const pipelines = useStore(state => state.pipelines);
  const leads = useStore(state => state.leads);
  const moveLead = useStore(state => state.moveLead);
  
  if (!currentUser) return null;

  // For MVP, just get the first pipeline of the tenant
  const pipeline = pipelines.find(p => p.tenantId === currentUser.tenantId);
  if (!pipeline) return <div>No pipeline found.</div>;

  const tenantLeads = leads.filter(l => l.tenantId === currentUser.tenantId);

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
        <button className="text-indigo-600 text-xs font-bold hover:underline">Ver Todos</button>
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
                                className={cn(
                                  "bg-white p-3 rounded-lg border shadow-sm border-l-4 select-none transition-shadow",
                                  snapshot.isDragging ? "shadow-md border-indigo-400 border-l-indigo-500" : "border-slate-200 border-l-blue-400 hover:border-slate-300"
                                )}
                              >
                                <p className="text-sm font-bold truncate text-slate-900">{lead.name}</p>
                                <p className="text-[11px] text-slate-500 mb-2">Origem: {lead.source}</p>
                                
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
    </div>
  );
}
