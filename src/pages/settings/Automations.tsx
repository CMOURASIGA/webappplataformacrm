import React, { useState } from 'react';
import { Bot, Clock3, History, Plus, Save, Tag, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useStore } from '../../store';
import type { AutomationRule } from '../../types';
import { generateId } from '../../lib/utils';

const icons = { ai_summary: History, stage_idle: Clock3, new_lead: Plus, classification: Bot };

export default function Automations() {
  const rules = useStore(state => state.automations);
  const saveAutomation = useStore(state => state.saveAutomation);
  const deleteAutomation = useStore(state => state.deleteAutomation);
  const tenantId = useStore(state => state.currentUser?.tenantId) || 'tenant-1';
  const [editing, setEditing] = useState<AutomationRule | null>(null);

  const create = () => setEditing({ id: generateId(), tenantId, name: '', description: '', enabled: true, trigger: 'stage_idle', delayHours: 24, action: 'attention_tag' });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Bot className="text-primary-600" /> Fluxos de automação</h1><p className="text-slate-500 mt-1">Cada cliente decide quais fluxos utilizar e seus parâmetros.</p></div>
        <Button onClick={create}><Plus size={16} className="mr-2" /> Novo fluxo</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rules.map(rule => {
          const Icon = icons[rule.trigger];
          return <div key={rule.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between gap-4"><div className="flex gap-3"><div className="rounded-lg bg-primary-50 p-2 text-primary-600"><Icon /></div><div><h3 className="font-bold text-slate-800">{rule.name}</h3><p className="mt-1 text-sm text-slate-500">{rule.description}</p></div></div>
              <button aria-label="Ativar fluxo" onClick={() => saveAutomation({ ...rule, enabled: !rule.enabled })} className={`h-6 w-11 rounded-full p-1 ${rule.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}><span className={`block h-4 w-4 rounded-full bg-white transition-transform ${rule.enabled ? 'translate-x-5' : ''}`} /></button>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500"><span>{rule.delayHours ? `Após ${rule.delayHours} horas sem ação` : 'Execução imediata'}</span><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setEditing(rule)}>Configurar</Button><Button variant="ghost" size="sm" onClick={() => deleteAutomation(rule.id)}><Trash2 size={14} /></Button></div></div>
          </div>;
        })}
      </div>
      {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <h2 className="text-lg font-bold">Configurar automação</h2>
        <label className="block text-sm font-semibold">Nome<input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-normal" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></label>
        <label className="block text-sm font-semibold">Descrição<textarea className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-normal" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} /></label>
        <label className="block text-sm font-semibold">Gatilho<select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-normal" value={editing.trigger} onChange={e => setEditing({ ...editing, trigger: e.target.value as AutomationRule['trigger'] })}><option value="ai_summary">Resumo de IA criado</option><option value="stage_idle">Tempo sem ação no Kanban</option><option value="new_lead">Novo lead recebido</option><option value="classification">Lead classificado</option></select></label>
        {editing.trigger === 'stage_idle' && <label className="block text-sm font-semibold">Horas sem ação<input type="number" min={1} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-normal" value={editing.delayHours || 24} onChange={e => setEditing({ ...editing, delayHours: Number(e.target.value) })} /></label>}
        <label className="block text-sm font-semibold">Ação<select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-normal" value={editing.action} onChange={e => setEditing({ ...editing, action: e.target.value as AutomationRule['action'] })}><option value="save_history">Salvar no histórico</option><option value="attention_tag">Aplicar etiqueta de atenção</option><option value="move_stage">Mover de etapa</option><option value="assign_user">Atribuir atendente</option></select></label>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button onClick={() => { saveAutomation(editing); setEditing(null); }}><Save size={15} className="mr-2" /> Salvar</Button></div>
      </div></div>}
    </div>
  );
}
