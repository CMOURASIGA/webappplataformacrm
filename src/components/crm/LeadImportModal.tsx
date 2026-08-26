import React, { useState } from 'react';
import { useStore } from '../../store';
import * as XLSX from 'xlsx';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Lead } from '../../types';

interface LeadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string | undefined;
  tenantLeads: Lead[];
  onImported: (message: string) => void;
}

/** Importação curta de leads via CSV/XLSX — FRONTEND_SPEC §6: ação pontual, então Modal central. */
export function LeadImportModal({ isOpen, onClose, tenantId, tenantLeads, onImported }: LeadImportModalProps) {
  const addLead = useStore(state => state.addLead);
  const pipelines = useStore(state => state.pipelines);
  const [importRows, setImportRows] = useState<Array<Record<string, string>>>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const reset = () => {
    setImportRows([]);
    setImportErrors([]);
  };

  const handleClose = () => {
    reset();
    onClose();
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
    onImported(`${imported} lead(s) importado(s). ${importRows.length - imported} linha(s) rejeitada(s) ou duplicada(s).`);
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar leads"
      description="Formatos aceitos: CSV e XLSX. Campos mínimos: nome e telefone."
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={confirmImport} disabled={!importRows.length}>Confirmar importação</Button>
        </>
      }
    >
      <div className="space-y-4">
        <a
          className="text-sm font-bold text-primary-600 underline"
          href={'data:text/csv;charset=utf-8,' + encodeURIComponent('name;phone;email;company;source;classification\nLead Exemplo;+55 00 00000-0099;exemplo@example.invalid;Empresa Exemplo;Importação;morno')}
          download="modelo-importacao-leads.csv"
        >
          Baixar modelo
        </a>
        <label className="block cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-600">
          Selecionar arquivo
          <input className="hidden" type="file" accept=".csv,.xlsx" onChange={event => { const file = event.target.files?.[0]; if (file) readImport(file); }} />
        </label>
        {importRows.length > 0 && (
          <div className="rounded-lg bg-slate-50 p-4 text-sm">
            <strong>{importRows.length} linha(s) encontrada(s).</strong>
            <p>{importErrors.length} ocorrência(s) para revisão.</p>
          </div>
        )}
        {importErrors.length > 0 && (
          <ul className="max-h-40 overflow-y-auto rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-warning-700">
            {importErrors.map(error => <li key={error}>{error}</li>)}
          </ul>
        )}
      </div>
    </Modal>
  );
}
