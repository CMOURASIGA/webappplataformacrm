import React, { useState } from 'react';
import { useStore } from '../../store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Trash2, Plus, GripVertical, Tag } from 'lucide-react';

export default function KanbanConfig() {
  const currentUser = useStore(state => state.currentUser);
  const isMaster = currentUser?.role === 'master';
  const activeTenantId = useStore(state => state.activeTenantId);
  
  const pipelines = useStore(state => state.pipelines);
  const tags = useStore(state => state.tags);
  const createStage = useStore(state => state.createStage);
  const deleteStage = useStore(state => state.deleteStage);
  const createTag = useStore(state => state.createTag);
  const deleteTag = useStore(state => state.deleteTag);

  const tenantId = isMaster ? activeTenantId : currentUser?.tenantId;
  const pipeline = pipelines.find(p => p.tenantId === tenantId);
  const pipelineStages = pipeline ? [...pipeline.stages].sort((a, b) => a.order - b.order) : [];

  const [newStageName, setNewStageName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#4f46e5');

  if (!tenantId) {
    return <div className="p-8 text-center text-slate-500">Selecione um tenant no menu superior para configurar o Kanban.</div>;
  }

  if (!pipeline) {
    return <div className="p-8 text-center text-slate-500">Nenhum pipeline encontrado.</div>;
  }

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    const nextOrder = pipelineStages.length > 0 ? Math.max(...pipelineStages.map(s => s.order)) + 1 : 0;
    await createStage(pipeline.id, newStageName, nextOrder);
    setNewStageName('');
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    await createTag(newTagName, newTagColor);
    setNewTagName('');
    setNewTagColor('#4f46e5');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configuração Kanban</h1>
        <p className="text-slate-500 mt-1">Gerencie os estágios do funil de vendas e as etiquetas (tags) para os leads.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stages */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <GripVertical size={20} className="text-slate-400" />
            Estágios do Funil
          </h2>
          
          <div className="space-y-3 mb-6">
            {pipelineStages.map(stage => (
              <div key={stage.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-medium text-slate-700">{stage.name}</span>
                <button 
                  onClick={() => deleteStage(stage.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Remover Estágio"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {pipelineStages.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Nenhum estágio configurado.</p>
            )}
          </div>

          <form onSubmit={handleAddStage} className="flex gap-2">
            <Input 
              placeholder="Nome do novo estágio..." 
              value={newStageName} 
              onChange={e => setNewStageName(e.target.value)} 
              className="flex-1"
            />
            <Button type="submit" disabled={!newStageName.trim()}><Plus size={16} /></Button>
          </form>
        </div>

        {/* Tags */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Tag size={20} className="text-slate-400" />
            Etiquetas (Tags)
          </h2>
          
          <div className="flex flex-wrap gap-2 mb-6 min-h-[50px] p-2 bg-slate-50 rounded-lg border border-slate-200">
            {tags.map(tag => (
              <div 
                key={tag.id} 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
                <button 
                  onClick={() => deleteTag(tag.id)}
                  className="hover:bg-black/20 rounded-full p-0.5 ml-1 transition-colors"
                  title="Remover Tag"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {tags.length === 0 && (
              <p className="text-sm text-slate-500 w-full text-center py-2">Nenhuma etiqueta configurada.</p>
            )}
          </div>

          <form onSubmit={handleAddTag} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-600 mb-1">Nome da Etiqueta</label>
              <Input 
                placeholder="Ex: Cliente VIP" 
                value={newTagName} 
                onChange={e => setNewTagName(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Cor</label>
              <div className="h-10 w-12 rounded-lg border border-slate-300 overflow-hidden p-0.5">
                <input 
                  type="color" 
                  value={newTagColor} 
                  onChange={e => setNewTagColor(e.target.value)}
                  className="w-full h-full border-0 p-0 cursor-pointer rounded-sm"
                />
              </div>
            </div>
            <Button type="submit" disabled={!newTagName.trim()} className="h-10 px-4">Adicionar</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
