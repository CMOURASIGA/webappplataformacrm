import React, { useState } from 'react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { useStore } from '../../store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Trash2, Plus, GripVertical, Tag } from 'lucide-react';

export default function KanbanConfig() {
  const currentUser = useStore(state => state.currentUser);
  const activeTenantId = useStore(state => state.activeTenantId);
  const pipelines = useStore(state => state.pipelines);
  const tags = useStore(state => state.tags);
  const leads = useStore(state => state.leads);
  const createStage = useStore(state => state.createStage);
  const deleteStage = useStore(state => state.deleteStage);
  const reorderStages = useStore(state => state.reorderStages);
  const createTag = useStore(state => state.createTag);
  const deleteTag = useStore(state => state.deleteTag);
  const tenantId = currentUser?.role === 'master' ? activeTenantId : currentUser?.tenantId;
  const pipeline = pipelines.find(item => item.tenantId === tenantId);
  const stages = pipeline ? [...pipeline.stages].sort((a, b) => a.order - b.order) : [];

  const [newStageName, setNewStageName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#4f46e5');

  if (!tenantId) return <div className="p-8 text-center text-slate-500">Selecione um cliente para configurar o funil.</div>;
  if (!pipeline) return <div className="p-8 text-center text-slate-500">Nenhum funil encontrado.</div>;

  const handleAddStage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newStageName.trim()) return;
    await createStage(pipeline.id, newStageName.trim(), stages.length);
    setNewStageName('');
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = [...stages];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    await reorderStages(pipeline.id, reordered.map(stage => stage.id));
  };

  const handleAddTag = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTagName.trim()) return;
    await createTag(newTagName.trim(), newTagColor);
    setNewTagName('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Configuração do funil</h1><p className="text-slate-500 mt-1">Arraste as etapas para definir a sequência comercial.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><GripVertical size={20} className="text-slate-400" />Etapas do funil</h2>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="pipeline-stages">
              {provided => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3 mb-6">
                  {stages.map((stage, index) => (
                    <React.Fragment key={stage.id}>
                      <Draggable draggableId={stage.id} index={index}>
                        {(dragProvided, snapshot) => (
                          <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className={`flex items-center justify-between p-3 bg-slate-50 rounded-lg border ${snapshot.isDragging ? 'border-primary-400 shadow-lg' : 'border-slate-200'}`}>
                            <div className="flex items-center gap-2"><button type="button" {...dragProvided.dragHandleProps} className="text-slate-400 cursor-grab" aria-label={`Mover ${stage.name}`}><GripVertical size={16} /></button><span className="font-medium text-slate-700">{stage.name}</span></div>
                            <button onClick={() => deleteStage(stage.id)} className="text-slate-400 hover:text-red-500" title="Remover etapa"><Trash2 size={16} /></button>
                          </div>
                        )}
                      </Draggable>
                    </React.Fragment>
                  ))}
                  {provided.placeholder}
                  {stages.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Nenhuma etapa configurada.</p>}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <form onSubmit={handleAddStage} className="flex gap-2"><Input placeholder="Nome da nova etapa" value={newStageName} onChange={e => setNewStageName(e.target.value)} /><Button type="submit" disabled={!newStageName.trim()}><Plus size={16} /></Button></form>
        </section>

        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Tag size={20} className="text-slate-400" />Etiquetas</h2>
          <div className="flex flex-wrap gap-2 mb-6 min-h-[50px] p-2 bg-slate-50 rounded-lg border border-slate-200">
            {tags.map(tag => <div key={tag.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: tag.color }}>{tag.name}<button onClick={() => { const count = leads.filter(lead => lead.tags?.includes(tag.id)).length; if (window.confirm(`Deseja excluir esta etiqueta? ${count} lead(s) terão a associação removida.`)) deleteTag(tag.id); }} title="Remover etiqueta"><Trash2 size={12} /></button></div>)}
            {tags.length === 0 && <p className="text-sm text-slate-500 w-full text-center py-2">Nenhuma etiqueta configurada.</p>}
          </div>
          <form onSubmit={handleAddTag} className="flex gap-2 items-end"><div className="flex-1"><label className="block text-xs font-bold text-slate-600 mb-1">Nome</label><Input value={newTagName} onChange={e => setNewTagName(e.target.value)} /></div><input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)} className="h-10 w-12" /><Button type="submit" disabled={!newTagName.trim()}>Adicionar</Button></form>
        </section>
      </div>
    </div>
  );
}
