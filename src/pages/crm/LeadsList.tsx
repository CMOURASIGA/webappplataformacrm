import React, { useMemo, useState } from 'react';
import { useStore } from '../../store';
import { Download, Mail, Phone, Upload } from 'lucide-react';
import type { Lead } from '../../types';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { FilterBar } from '../../components/ui/FilterBar';
import { SearchField } from '../../components/ui/SearchField';
import { Select } from '../../components/ui/Select';
import { Badge, type BadgeVariant } from '../../components/ui/Badge';
import { Tag } from '../../components/ui/Tag';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import { EmptyState } from '../../components/ui/EmptyState';
import { LeadFormDrawer } from '../../components/crm/LeadFormDrawer';
import { LeadWorkspaceDrawer } from '../../components/crm/LeadWorkspaceDrawer';
import { LeadImportModal } from '../../components/crm/LeadImportModal';

type ClassificationFilter = 'all' | 'unclassified' | NonNullable<Lead['classification']>;

const classificationVariant: Record<NonNullable<Lead['classification']>, BadgeVariant> = {
  quente: 'danger',
  morno: 'warning',
  frio: 'info',
};

const PAGE_SIZE = 25;

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
  const tags = useStore(state => state.tags);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [feedback, setFeedback] = useState('');

  const [search, setSearch] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<ClassificationFilter>('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (!currentUser) return null;

  const tenantId = currentUser.role === 'master' ? activeTenantId : currentUser.tenantId;
  const tenantLeads = leads.filter(lead => lead.tenantId === tenantId);
  const tenantTags = tags.filter(tag => tag.tenantId === tenantId);

  const hasActiveFilters = search.trim() !== '' || classificationFilter !== 'all' || sourceFilter !== 'all' || tagFilter !== 'all';

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tenantLeads.filter(lead => {
      const searchMatches = !term || [lead.name, lead.phone, lead.email, lead.company].some(field => field?.toLowerCase().includes(term));
      const classificationMatches = classificationFilter === 'all' || (classificationFilter === 'unclassified' ? !lead.classification : lead.classification === classificationFilter);
      const sourceMatches = sourceFilter === 'all' || lead.source === sourceFilter;
      const tagMatches = tagFilter === 'all' || lead.tags?.includes(tagFilter);
      return searchMatches && classificationMatches && sourceMatches && tagMatches;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantLeads, search, classificationFilter, sourceFilter, tagFilter]);

  const visibleLeads = filteredLeads.slice(0, visibleCount);
  const detailLead = detailLeadId ? leads.find(item => item.id === detailLeadId) || null : null;

  const clearFilters = () => {
    setSearch('');
    setClassificationFilter('all');
    setSourceFilter('all');
    setTagFilter('all');
    setVisibleCount(PAGE_SIZE);
  };

  const updateFilter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setVisibleCount(PAGE_SIZE);
  };

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
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-${classificationFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cs-page">
      <PageHeader
        title="Lista de leads"
        description="Filtre por classificação e exporte uma lista compatível com Excel e públicos da Meta."
        actions={
          <>
            <Button variant="outline" onClick={exportLeads} disabled={filteredLeads.length === 0}><Download size={15} className="mr-1.5" /> Exportar</Button>
            <Button variant="outline" onClick={() => setShowImport(true)}><Upload size={15} className="mr-1.5" /> Importar</Button>
          </>
        }
        primaryAction={<Button onClick={() => { setEditingLead(null); setIsFormOpen(true); }}>Adicionar lead</Button>}
      />

      {feedback && (
        <div className="rounded-lg border border-success-100 bg-success-50 px-3 py-2 text-sm text-success-700">{feedback}</div>
      )}

      <FilterBar onClear={hasActiveFilters ? clearFilters : undefined}>
        <SearchField
          value={search}
          onChange={updateFilter(setSearch)}
          placeholder="Buscar por nome, telefone, e-mail ou empresa..."
          className="min-w-[16rem] flex-1"
        />
        <Select value={classificationFilter} onChange={e => updateFilter(setClassificationFilter)(e.target.value as ClassificationFilter)} className="max-w-[12rem]" aria-label="Classificação">
          <option value="all">Classificação</option>
          <option value="quente">Quente</option>
          <option value="morno">Morno</option>
          <option value="frio">Frio</option>
          <option value="unclassified">Não classificados</option>
        </Select>
        <Select value={sourceFilter} onChange={e => updateFilter(setSourceFilter)(e.target.value)} className="max-w-[12rem]" aria-label="Origem">
          <option value="all">Origem</option>
          {Array.from(new Set(tenantLeads.map(lead => lead.source))).sort().map(source => <option key={source} value={source}>{source}</option>)}
        </Select>
        <Select value={tagFilter} onChange={e => updateFilter(setTagFilter)(e.target.value)} className="max-w-[12rem]" aria-label="Etiqueta">
          <option value="all">Etiqueta</option>
          {tenantTags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
        </Select>
      </FilterBar>

      {tenantLeads.length === 0 ? (
        <EmptyState
          title="Nenhum lead cadastrado ainda"
          description="Cadastre o primeiro lead manualmente ou importe uma planilha."
          action={<Button size="sm" onClick={() => { setEditingLead(null); setIsFormOpen(true); }}>Adicionar lead</Button>}
        />
      ) : filteredLeads.length === 0 ? (
        <EmptyState
          title="Nenhum resultado para os filtros aplicados"
          description="Ajuste a busca ou limpe os filtros para ver todos os leads."
          action={<Button variant="outline" size="sm" onClick={clearFilters}>Limpar filtros</Button>}
        />
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>Contato</TableHeaderCell>
                <TableHeaderCell>Origem</TableHeaderCell>
                <TableHeaderCell>Classificação</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell aria-label="Ações" />
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleLeads.map(lead => (
                <TableRow key={lead.id} clickable onClick={() => setDetailLeadId(lead.id)}>
                  <TableCell>
                    <div className="text-sm font-bold text-slate-900">{lead.name}</div>
                    {lead.company && <div className="mt-0.5 text-xs text-slate-500">{lead.company}</div>}
                    {(lead.tags || []).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(lead.tags || []).map(id => {
                          const tag = tags.find(item => item.id === id);
                          return tag ? <Tag key={id} color={tag.color} className="text-[10px]">{tag.name}</Tag> : null;
                        })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700"><Phone size={12} /> {lead.phone}</div>
                    {lead.email && <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Mail size={12} /> {lead.email}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-slate-600">{lead.source}</div>
                    <span className="text-[10px] text-slate-400">{lead.sourceType === 'automatic' ? 'Automática' : 'Informada manualmente'}</span>
                  </TableCell>
                  <TableCell>
                    {lead.classification ? (
                      <Badge variant={classificationVariant[lead.classification]}>{lead.classification}</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Não classificado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary" className="capitalize">{lead.status.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={event => { event.stopPropagation(); setEditingLead(lead); setIsFormOpen(true); }}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {visibleCount < filteredLeads.length && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>
                Carregar mais ({filteredLeads.length - visibleCount} restantes)
              </Button>
            </div>
          )}
        </>
      )}

      <LeadFormDrawer isOpen={isFormOpen} lead={editingLead} onClose={() => { setIsFormOpen(false); setEditingLead(null); }} />

      <LeadWorkspaceDrawer
        lead={detailLead}
        isOpen={!!detailLead}
        onClose={() => setDetailLeadId(null)}
        onEdit={lead => { setDetailLeadId(null); setEditingLead(lead); setIsFormOpen(true); }}
      />

      <LeadImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        tenantId={tenantId}
        tenantLeads={tenantLeads}
        onImported={setFeedback}
      />
    </div>
  );
}
