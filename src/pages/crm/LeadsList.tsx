import React, { useState } from 'react';
import { useStore } from '../../store';
import { Phone, Mail } from 'lucide-react';
import type { Lead } from '../../types';
import { Button } from '../../components/ui/Button';
import { AddLeadModal } from '../../components/crm/AddLeadModal';

export default function LeadsList() {
  const currentUser = useStore(state => state.currentUser);
  const leads = useStore(state => state.leads);
  const activeTenantId = useStore(state => state.activeTenantId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
  if (!currentUser) return null;

  const tenantId = currentUser.role === 'master' ? activeTenantId : currentUser.tenantId;
  const tenantLeads = leads.filter(l => l.tenantId === tenantId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold text-slate-700 uppercase tracking-tight">Todos os leads</h1>
        <Button onClick={() => { setEditingLead(null); setIsModalOpen(true); }}>Adicionar lead</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* ... table content remains the same ... */}

        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contato</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Origem</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {tenantLeads.map(lead => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-bold text-slate-900 text-sm">{lead.name}</div>
                  {lead.company && <div className="text-[11px] text-slate-500 mt-1">{lead.company}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-xs text-slate-700 flex items-center gap-1.5 font-medium"><Phone size={12}/> {lead.phone}</div>
                  {lead.email && <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1"><Mail size={12}/> {lead.email}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">
                  <div>{lead.source}</div>
                  <span className="text-[10px] text-slate-400">{lead.sourceType === 'automatic' ? 'Automática' : 'Informada manualmente'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full bg-primary-100 text-primary-700 capitalize">
                    {lead.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingLead(lead); setIsModalOpen(true); }}>Editar</Button>
                </td>
              </tr>
            ))}
            {tenantLeads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-slate-500 text-sm font-medium">
                  Nenhum lead encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AddLeadModal isOpen={isModalOpen} lead={editingLead} onClose={() => { setIsModalOpen(false); setEditingLead(null); }} />
    </div>
  );
}
