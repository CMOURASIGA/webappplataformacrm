import React, { useState } from 'react';
import { useStore } from '../../store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X } from 'lucide-react';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddLeadModal({ isOpen, onClose }: AddLeadModalProps) {
  const currentUser = useStore(state => state.currentUser);
  const pipelines = useStore(state => state.pipelines);
  const activeTenantId = useStore(state => state.activeTenantId);
  const addLead = useStore(state => state.addLead);

  const tenantId = currentUser?.role === 'master' ? activeTenantId : currentUser?.tenantId;
  const pipeline = pipelines.find(p => p.tenantId === tenantId);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('Manual');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !pipeline || !tenantId) return;

    const firstStage = [...pipeline.stages].sort((a, b) => a.order - b.order)[0];
    if (!firstStage) return;

    await addLead({
      tenantId,
      name,
      phone,
      email,
      company,
      source,
      status: 'new',
      stageId: firstStage.id,
      pipelineId: pipeline.id,
      notes: '',
      tags: []
    });

    setName('');
    setPhone('');
    setEmail('');
    setCompany('');
    setSource('Manual');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-full">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Novo Lead</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nome *</label>
            <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Nome do lead" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp / Telefone *</label>
            <Input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+55 11 99999-9999" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Empresa</label>
            <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Nome da empresa" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Origem</label>
            <select 
              value={source} 
              onChange={e => setSource(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="Manual">Manual</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Website">Site / Formulário</option>
              <option value="Instagram">Instagram</option>
            </select>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar Lead</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
