import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X } from 'lucide-react';
import type { Lead } from '../../types';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
}

export function AddLeadModal({ isOpen, onClose, lead }: AddLeadModalProps) {
  const currentUser = useStore(state => state.currentUser);
  const pipelines = useStore(state => state.pipelines);
  const activeTenantId = useStore(state => state.activeTenantId);
  const addLead = useStore(state => state.addLead);
  const updateLead = useStore(state => state.updateLead);
  const tenantId = currentUser?.role === 'master' ? activeTenantId : currentUser?.tenantId;
  const pipeline = pipelines.find(p => p.tenantId === tenantId);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('Cadastro manual');
  const [classification, setClassification] = useState<NonNullable<Lead['classification']> | ''>('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(lead?.name || '');
    setPhone(lead?.phone || '');
    setEmail(lead?.email || '');
    setCompany(lead?.company || '');
    setSource(lead?.source || 'Cadastro manual');
    setClassification(lead?.classification || '');
    setError('');
  }, [isOpen, lead]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !phone.trim() || !pipeline || !tenantId) {
      setError('Preencha nome e telefone e verifique se há um funil configurado.');
      return;
    }
    const firstStage = [...pipeline.stages].sort((a, b) => a.order - b.order)[0];
    if (!lead && !firstStage) return setError('O funil não possui etapas.');

    setSaving(true);
    setError('');
    try {
      const values = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        company: company.trim(),
        source,
        sourceType: automaticSource ? 'automatic' as const : 'manual' as const,
        classification: classification || null,
      };
      if (lead) {
        await updateLead(lead.id, values);
      } else {
        await addLead({ ...values, tenantId, status: 'new', stageId: firstStage.id, pipelineId: pipeline.id, notes: '', tags: [] });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o lead.');
    } finally {
      setSaving(false);
    }
  };

  const automaticSource = lead?.sourceType === 'automatic';

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-full">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{lead ? 'Editar lead' : 'Novo lead'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Fechar"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          <div><label className="block text-sm font-bold text-slate-700 mb-1">Nome *</label><Input required value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp / telefone *</label><Input required value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">Empresa</label><Input value={company} onChange={e => setCompany(e.target.value)} /></div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Classificacao do lead</label>
            <select
              value={classification}
              onChange={e => setClassification(e.target.value as NonNullable<Lead['classification']> | '')}
              className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm"
            >
              <option value="">Nao classificado</option>
              <option value="frio">Frio</option>
              <option value="morno">Morno</option>
              <option value="quente">Quente</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">Pode ser definida manualmente ou atualizada pela classificacao de IA na conversa.</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Origem informada</label>
            <select value={source} onChange={e => setSource(e.target.value)} disabled={automaticSource} className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm disabled:bg-slate-100">
              {automaticSource && <option value={lead?.source}>{lead?.source}</option>}
              <option value="Cadastro manual">Cadastro manual</option>
              <option value="Telefone">Telefone</option>
              <option value="Indicação">Indicação</option>
              <option value="Outro">Outro</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">{automaticSource ? 'Origem registrada automaticamente por uma integração.' : 'Origem informada manualmente. Não representa uma integração ativa.'}</p>
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar lead'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
