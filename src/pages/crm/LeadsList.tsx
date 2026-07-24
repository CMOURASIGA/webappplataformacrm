import React, { useState } from 'react';
import { useStore } from '../../store';
import { Download, FileText, History, Mail, MessageCircleMore, Paperclip, Phone, Trash2, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';
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
  const [sourceFilter, setSourceFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [workspaceLeadId, setWorkspaceLeadId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'conversation' | 'history' | 'discussion' | 'data'>('history');
  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState<Array<Record<string, string>>>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const addLeadAttachment = useStore(state => state.addLeadAttachment);
  const removeLeadAttachment = useStore(state => state.removeLeadAttachment);
  const addLead = useStore(state => state.addLead);
  const pipelines = useStore(state => state.pipelines);
  const tags = useStore(state => state.tags);
  const internalChannels = useStore(state => state.internalChannels);
  const internalMessages = useStore(state => state.internalMessages);
  const users = useStore(state => state.users);

  if (!currentUser) return null;

  const tenantId = currentUser.role === 'master' ? activeTenantId : currentUser.tenantId;
  const tenantLeads = leads.filter(lead => lead.tenantId === tenantId);
  const filteredLeads = tenantLeads.filter(lead => {
    const classificationMatches = classificationFilter === 'all' || (classificationFilter === 'unclassified' ? !lead.classification : lead.classification === classificationFilter);
    const sourceMatches = sourceFilter === 'all' || lead.source === sourceFilter;
    const tagMatches = tagFilter === 'all' || lead.tags?.includes(tagFilter);
    return classificationMatches && sourceMatches && tagMatches;
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

  const readImport = async (file: File) => {
    setImportErrors([]);
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
    const errors: string[] = [];
    const seen = new Set(tenantLeads.map(lead => `${lead.email || ''}|${lead.phone}`.toLowerCase()));
    rows.forEach((row, index) => {
      const name = row.name || row.nome || [row.first_name, row.last_name].filter(Boolean).join(' ');
      const phone = row.phone || row.telefone;
      const email = row.email;
      if (!name || !phone) errors.push(`Linha ${index + 2}: nome e telefone são obrigatórios.`);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push(`Linha ${index + 2}: e-mail inválido.`);
      const key = `${email || ''}|${phone}`.toLowerCase();
      if (seen.has(key)) errors.push(`Linha ${index + 2}: lead duplicado.`);
      seen.add(key);
    });
    setImportRows(rows);
    setImportErrors(errors);
  };

  const confirmImport = async () => {
    const pipeline = pipelines.find(item => item.tenantId === tenantId);
    const stage = pipeline && [...pipeline.stages].sort((a, b) => a.order - b.order)[0];
    if (!pipeline || !stage || !tenantId) return setImportErrors(['Não existe funil inicial configurado.']);
    let imported = 0;
    for (const row of importRows) {
      const name = row.name || row.nome || [row.first_name, row.last_name].filter(Boolean).join(' ');
      const phone = row.phone || row.telefone;
      const email = row.email;
      const duplicate = tenantLeads.some(lead => (email && lead.email?.toLowerCase() === email.toLowerCase()) || lead.phone === phone);
      if (!name || !phone || duplicate || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) continue;
      await addLead({ tenantId, name, phone, email, company: row.company || row.empresa, source: row.source || row.origem || 'Importação', sourceType: 'manual', classification: ['frio', 'morno', 'quente'].includes((row.classification || '').toLowerCase()) ? row.classification.toLowerCase() as Lead['classification'] : null, status: 'new', stageId: stage.id, pipelineId: pipeline.id, notes: row.notes || row.observacoes || '', tags: [] });
      imported++;
    }
    setFeedback(`${imported} lead(s) importado(s). ${importRows.length - imported} linha(s) rejeitada(s) ou duplicada(s).`);
    setShowImport(false); setImportRows([]); setImportErrors([]);
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
          <label className="text-xs font-bold text-slate-600"><span className="mb-1 block">Origem</span><select value={sourceFilter} onChange={event => setSourceFilter(event.target.value)} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal"><option value="all">Todas</option>{Array.from(new Set(tenantLeads.map(lead => lead.source))).sort().map(source => <option key={source} value={source}>{source}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-600"><span className="mb-1 block">Etiqueta</span><select value={tagFilter} onChange={event => setTagFilter(event.target.value)} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal"><option value="all">Todas</option>{tags.filter(tag => tag.tenantId === tenantId).map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></label>
          <Button variant="outline" onClick={exportLeads} disabled={filteredLeads.length === 0}><Download size={15} className="mr-1.5" /> Exportar</Button>
          <Button variant="outline" onClick={() => setShowImport(true)}><Upload size={15} className="mr-1.5" /> Importar</Button>
          <Button onClick={() => { setEditingLead(null); setIsModalOpen(true); }}>Adicionar lead</Button>
        </div>
      </div>
      {feedback && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{feedback}</div>}

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
                  <div className="mt-1 flex flex-wrap gap-1">{(lead.tags || []).map(id => { const tag = tags.find(item => item.id === id); return tag ? <span key={id} className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span> : null; })}</div>
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
                  <Button variant="ghost" size="sm" onClick={() => { setWorkspaceLeadId(lead.id); setWorkspaceTab('history'); }}><Paperclip size={14} className="mr-1" /> Abrir ficha</Button>
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
            <nav className="mt-6 flex gap-2 border-b border-slate-200">{(['conversation', 'history', 'discussion', 'data'] as const).map(tab => <button key={tab} onClick={() => setWorkspaceTab(tab)} className={cn('border-b-2 px-3 py-2 text-sm font-bold', workspaceTab === tab ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500')}>{({ conversation: 'Conversa', history: 'Histórico', discussion: 'Discussão', data: 'Dados' })[tab]}</button>)}</nav>
            {workspaceTab === 'conversation' && <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-bold">Conversa com o lead</h3><p className="mt-2 text-sm text-slate-500">Abra o atendimento para consultar mensagens, usar respostas rápidas e registrar um novo histórico.</p><Button className="mt-4" onClick={() => window.location.assign(`/chat?lead=${lead.id}`)}>Abrir atendimento</Button></section>}
            {workspaceTab === 'history' && <><section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between"><h3 className="font-bold flex items-center gap-2"><Paperclip size={17} /> Anexos</h3><label className="cursor-pointer rounded-md bg-primary-600 px-3 py-2 text-xs font-bold text-white">Adicionar arquivo<input className="hidden" type="file" onChange={event => { const file = event.target.files?.[0]; if (file) addLeadAttachment(lead.id, file); event.currentTarget.value = ''; }} /></label></div>
              <div className="mt-4 space-y-2">{(lead.attachments || []).map(file => <div key={file.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3"><div className="flex items-center gap-2"><FileText className="text-primary-500" size={18} /><div><p className="text-sm font-semibold">{file.name}</p><p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB, {new Date(file.createdAt).toLocaleDateString('pt-BR')}</p></div></div><button className="text-slate-400 hover:text-red-600" onClick={() => removeLeadAttachment(lead.id, file.id)}><Trash2 size={16} /></button></div>)}{!lead.attachments?.length && <p className="py-4 text-center text-sm text-slate-400">Nenhum arquivo vinculado.</p>}</div>
            </section>
            <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold flex items-center gap-2"><History size={17} /> Histórico de atendimento</h3>
              <div className="mt-4 space-y-3">{(lead.history || []).map(entry => <div key={entry.id} className="border-l-2 border-primary-300 pl-4"><div className="flex justify-between gap-3"><p className="text-sm font-bold text-slate-700">{entry.title}</p><span className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString('pt-BR')}</span></div><p className="mt-1 text-sm text-slate-600">{entry.content}</p></div>)}{!lead.history?.length && <p className="py-4 text-center text-sm text-slate-400">O histórico será alimentado por resumos, notas e automações.</p>}</div>
            </section></>}
            {workspaceTab === 'discussion' && <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5"><h3 className="flex items-center gap-2 font-bold"><MessageCircleMore size={17} /> Discussão interna</h3>{internalChannels.filter(channel => channel.leadId === lead.id).map(channel => <div key={channel.id} className="mt-4"><p className="text-sm font-bold">{channel.name}</p>{internalMessages.filter(message => message.channelId === channel.id).map(message => <div key={message.id} className="mt-2 rounded-lg bg-slate-50 p-3 text-sm"><strong>{users.find(user => user.id === message.senderId)?.name}:</strong> {message.text}</div>)}</div>)}{!internalChannels.some(channel => channel.leadId === lead.id) && <p className="mt-3 text-sm text-slate-400">Ainda não existe discussão interna para este lead.</p>}<Button className="mt-4" variant="outline" onClick={() => window.location.assign('/chat/internal')}>Abrir chat interno</Button></section>}
            {workspaceTab === 'data' && <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-bold">Dados do lead</h3><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-slate-400">Nome</dt><dd className="font-semibold">{lead.name}</dd></div><div><dt className="text-slate-400">Telefone</dt><dd>{lead.phone}</dd></div><div><dt className="text-slate-400">E-mail</dt><dd>{lead.email || 'Não informado'}</dd></div><div><dt className="text-slate-400">Origem</dt><dd>{lead.source}</dd></div><div><dt className="text-slate-400">Etiquetas</dt><dd className="flex flex-wrap gap-1">{(lead.tags || []).map(id => <span key={id} className="rounded bg-slate-100 px-2 py-1 text-xs">{tags.find(tag => tag.id === id)?.name}</span>)}</dd></div><div><dt className="text-slate-400">Observações</dt><dd>{lead.notes || 'Nenhuma'}</dd></div></dl><Button className="mt-4" onClick={() => { setEditingLead(lead); setIsModalOpen(true); }}>Editar dados</Button></section>}
          </div>
        </div>;
      })()}
      {showImport && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="w-full max-w-2xl space-y-4 rounded-xl bg-white p-6 shadow-xl"><div className="flex justify-between"><div><h2 className="text-lg font-bold">Importar leads</h2><p className="text-sm text-slate-500">Formatos aceitos: CSV e XLSX. Campos mínimos: nome e telefone.</p></div><button onClick={() => setShowImport(false)}><X /></button></div><a className="text-sm font-bold text-primary-600 underline" href={'data:text/csv;charset=utf-8,' + encodeURIComponent('name;phone;email;company;source;classification\nLead Exemplo;+55 00 00000-0099;exemplo@example.invalid;Empresa Exemplo;Importação;morno')} download="modelo-importacao-leads.csv">Baixar modelo</a><label className="block cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-600">Selecionar arquivo<input className="hidden" type="file" accept=".csv,.xlsx" onChange={event => { const file = event.target.files?.[0]; if (file) readImport(file); }} /></label>{importRows.length > 0 && <div className="rounded-lg bg-slate-50 p-4 text-sm"><strong>{importRows.length} linha(s) encontrada(s).</strong><p>{importErrors.length} ocorrência(s) para revisão.</p></div>}{importErrors.length > 0 && <ul className="max-h-40 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{importErrors.map(error => <li key={error}>{error}</li>)}</ul>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowImport(false)}>Cancelar</Button><Button onClick={confirmImport} disabled={!importRows.length}>Confirmar importação</Button></div></div></div>}
    </div>
  );
}
