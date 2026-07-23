import React, { useState } from 'react';
import { useStore } from '../../store';
import { Download, FileText, History, Mail, Paperclip, Phone, Trash2, X } from 'lucide-react';
import type { Lead } from '../../types';
import { Button } from '../../components/ui/Button';
import { AddLeadModal } from '../../components/crm/AddLeadModal';
import { cn } from '../../lib/utils';

type ClassificationFilter = 'all' | 'unclassified' | NonNullable<Lead['classification']>;

const classificationStyles: Record<NonNullable<Lead['classification']>, string> = {
  frio: 'bg-sky-100 text-sky-700',
  morno: 'bg-amber-100 text-amber-700',
  quente: 'bg-rose-100 text-rose-700',
};

function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts.shift() || '',
    lastName: parts.join(' '),
  };
}

export default function LeadsList() {
  const currentUser = useStore(state => state.currentUser);
  const leads = useStore(state => state.leads);
  const activeTenantId = useStore(state => state.activeTenantId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [classificationFilter, setClassificationFilter] = useState<ClassificationFilter>('all');
  const [workspaceLeadId, setWorkspaceLeadId] = useState<string | null>(null);
  const addLeadAttachment = useStore(state => state.addLeadAttachment);
  const removeLeadAttachment = useStore(state => state.removeLeadAttachment);

  if (!currentUser) return null;

  const tenantId = currentUser.role === 'master' ? activeTenantId : currentUser.tenantId;
  const tenantLeads = leads.filter(lead => lead.tenantId === tenantId);
  const filteredLeads = tenantLeads.filter(lead => {
    if (classificationFilter === 'all') return true;
    if (classificationFilter === 'unclassified') return !lead.classification;
    return lead.classification === classificationFilter;
  });

  const exportLeads = () => {
    const headers = [
      'email', 'phone', 'first_name', 'last_name', 'country',
      'classification', 'intention', 'priority', 'sentiment',
      'company', 'source',
    ];
    const rows = filteredLeads.map(lead => {
      const { firstName, lastName } = splitName(lead.name);
      return [
        lead.email,
        lead.phone,
        firstName,
        lastName,
        'BR',
        lead.classification || '',
        lead.classificationDetails?.intencao || '',
        lead.classificationDetails?.prioridade || '',
        lead.classificationDetails?.sentimento || '',
        lead.company || '',
        lead.source,
      ];
    });
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(';')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-${classificationFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-700 uppercase tracking-tight">Todos os leads</h1>
          <p className="mt-1 text-sm text-slate-500">Filtre por classificacao e exporte uma lista compativel com Excel e publicos da Meta.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-bold text-slate-600">
            <span className="mb-1 block">Classificacao</span>
            <select
              value={classificationFilter}
              onChange={event => setClassificationFilter(event.target.value as ClassificationFilter)}
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal"
            >
              <option value="all">Todas</option>
              <option value="quente">Quente</option>
              <option value="morno">Morno</option>
              <option value="frio">Frio</option>
              <option value="unclassified">Nao classificados</option>
            </select>
          </label>
          <Button variant="outline" onClick={exportLeads} disabled={filteredLeads.length === 0}>
            <Download size={15} className="mr-1.5" /> Exportar Excel (.csv)
          </Button>
          <Button onClick={() => { setEditingLead(null); setIsModalOpen(true); }}>Adicionar lead</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contato</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Origem</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Classificacao</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acoes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {filteredLeads.map(lead => (
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
                  <span className="text-[10px] text-slate-400">{lead.sourceType === 'automatic' ? 'Automatica' : 'Informada manualmente'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {lead.classification ? (
                    <span className={cn('px-2.5 py-1 inline-flex text-[10px] font-bold rounded-full uppercase', classificationStyles[lead.classification])}>
                      {lead.classification}
                    </span>
                  ) : <span className="text-xs text-slate-400">Nao classificado</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full bg-primary-100 text-primary-700 capitalize">
                    {lead.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button variant="ghost" size="sm" onClick={() => setWorkspaceLeadId(lead.id)}><Paperclip size={14} className="mr-1" /> Histórico e anexos</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditingLead(lead); setIsModalOpen(true); }}>Editar ficha</Button>
                </td>
              </tr>
            ))}
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm font-medium">
                  Nenhum lead encontrado para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AddLeadModal isOpen={isModalOpen} lead={editingLead} onClose={() => { setIsModalOpen(false); setEditingLead(null); }} />
      {workspaceLeadId && (() => {
        const lead = leads.find(item => item.id === workspaceLeadId);
        if (!lead) return null;
        return <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-slate-50 p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><h2 className="text-xl font-bold text-slate-800">{lead.name}</h2><p className="text-sm text-slate-500">Histórico consolidado e arquivos vinculados ao lead</p></div><button onClick={() => setWorkspaceLeadId(null)}><X /></button></div>
            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between"><h3 className="font-bold flex items-center gap-2"><Paperclip size={17} /> Anexos</h3><label className="cursor-pointer rounded-md bg-primary-600 px-3 py-2 text-xs font-bold text-white">Adicionar arquivo<input className="hidden" type="file" onChange={event => { const file = event.target.files?.[0]; if (file) addLeadAttachment(lead.id, file); event.currentTarget.value = ''; }} /></label></div>
              <div className="mt-4 space-y-2">{(lead.attachments || []).map(file => <div key={file.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3"><div className="flex items-center gap-2"><FileText className="text-primary-500" size={18} /><div><p className="text-sm font-semibold">{file.name}</p><p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB, {new Date(file.createdAt).toLocaleDateString('pt-BR')}</p></div></div><button className="text-slate-400 hover:text-red-600" onClick={() => removeLeadAttachment(lead.id, file.id)}><Trash2 size={16} /></button></div>)}{!lead.attachments?.length && <p className="py-4 text-center text-sm text-slate-400">Nenhum arquivo vinculado.</p>}</div>
            </section>
            <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold flex items-center gap-2"><History size={17} /> Histórico de atendimento</h3>
              <div className="mt-4 space-y-3">{(lead.history || []).map(entry => <div key={entry.id} className="border-l-2 border-primary-300 pl-4"><div className="flex justify-between gap-3"><p className="text-sm font-bold text-slate-700">{entry.title}</p><span className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString('pt-BR')}</span></div><p className="mt-1 text-sm text-slate-600">{entry.content}</p></div>)}{!lead.history?.length && <p className="py-4 text-center text-sm text-slate-400">O histórico será alimentado por resumos, notas e automações.</p>}</div>
            </section>
          </div>
        </div>;
      })()}
    </div>
  );
}
