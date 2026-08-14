import React, { useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import { fetchApi, fetchApiResponse } from '../../lib/api';

export function ImportLeadsModal({ isOpen, onClose, onImported }: { isOpen: boolean; onClose: () => void; onImported: () => Promise<void> | void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [duplicateMode, setDuplicateMode] = useState('ignore');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (!isOpen) return null;

  const download = async (endpoint: string, name: string) => {
    const response = await fetchApiResponse(endpoint);
    if (response.status === 204) return;
    const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
  };
  const validate = async () => {
    if (!file) return; setLoading(true); setError(''); setResult(null);
    try { const form = new FormData(); form.append('file', file); const response = await fetchApiResponse('/leads/import/preview', { method: 'POST', body: form }); setPreview(await response.json()); }
    catch (error: any) { setError(error.message); } finally { setLoading(false); }
  };
  const execute = async () => {
    setLoading(true); setError('');
    try { const data = await fetchApi('/leads/import/execute', { method: 'POST', body: JSON.stringify({ fileName: preview.fileName, duplicateMode, rows: preview.rows }) }); setResult(data); await onImported(); }
    catch (error: any) { setError(error.message); } finally { setLoading(false); }
  };
  const close = () => { setFile(null); setPreview(null); setResult(null); setError(''); onClose(); };

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4"><div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-md bg-white shadow-2xl">
    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="font-bold text-slate-800">Importar leads</h2><p className="text-xs text-slate-500">Valide CSV ou XLSX antes de criar qualquer lead.</p></div><button title="Fechar" onClick={close} className="p-1 text-slate-400 hover:text-slate-700"><X size={20} /></button></div>
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex flex-wrap items-center gap-3 rounded border border-slate-200 bg-slate-50 p-4"><button onClick={() => download('/leads/import/template', 'modelo-importacao-leads.csv')} className="flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"><Download size={16} /> Baixar modelo</button><label className="flex cursor-pointer items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"><FileSpreadsheet size={16} /><span>{file?.name || 'Selecionar CSV ou XLSX'}</span><input type="file" accept=".csv,.xlsx" className="hidden" onChange={event => { setFile(event.target.files?.[0] || null); setPreview(null); }} /></label><button onClick={validate} disabled={!file || loading} className="flex items-center gap-2 rounded bg-primary-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-40">{loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Validar arquivo</button></div>
      {error && <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {preview && !result && <><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Total', preview.totalRows], ['Validos', preview.validRows], ['Com erro', preview.errorRows], ['Duplicidades', preview.duplicateRows]].map(([label, value]) => <div key={label as string} className="border-l-2 border-primary-500 bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase text-slate-500">{label}</p><p className="text-xl font-bold text-slate-800">{value}</p></div>)}</div>
        <div className="mt-4 flex items-center gap-3"><label className="text-xs font-bold text-slate-600">Duplicidades<select value={duplicateMode} onChange={event => setDuplicateMode(event.target.value)} className="ml-2 h-8 rounded border border-slate-300 bg-white px-2 font-normal"><option value="ignore">Ignorar e relatar</option><option value="update">Atualizar existente</option><option value="create">Criar novo lead</option></select></label></div>
        <div className="mt-4 max-h-72 overflow-auto border border-slate-200"><table className="min-w-full text-left text-xs"><thead className="sticky top-0 bg-slate-100"><tr><th className="p-2">Linha</th><th className="p-2">Nome</th><th className="p-2">Telefone</th><th className="p-2">Status</th></tr></thead><tbody>{preview.rows.map((row: any) => <tr key={row.rowNumber} className="border-t border-slate-100"><td className="p-2">{row.rowNumber}</td><td className="p-2">{row.data.name}</td><td className="p-2">{row.data.phone}</td><td className="p-2">{row.errors.length ? <span className="text-red-700">{row.errors.join('; ')}</span> : row.duplicate ? <span className="text-amber-700">Duplicado: {row.duplicate.name}</span> : <span className="text-emerald-700">Valido</span>}</td></tr>)}</tbody></table></div></>}
      {result && <div className="mt-5 rounded border border-emerald-200 bg-emerald-50 p-5"><h3 className="font-bold text-emerald-900">Importacao concluida</h3><p className="mt-2 text-sm text-emerald-800">{result.importedRows} importados · {result.duplicateRows} duplicidades ignoradas · {result.errorRows} com erro.</p>{(result.errorRows > 0 || result.duplicateRows > 0) && <button onClick={() => download(`/leads/imports/${result.batchId}/errors`, `erros-importacao-${result.batchId}.csv`)} className="mt-3 flex items-center gap-2 rounded border border-emerald-300 bg-white px-3 py-2 text-sm font-bold text-emerald-800"><Download size={15} /> Baixar relatorio</button>}</div>}
    </div>
    <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4"><button onClick={close} className="rounded px-4 py-2 text-sm text-slate-600">{result ? 'Fechar' : 'Cancelar'}</button>{preview && !result && <button onClick={execute} disabled={loading || preview.validRows === 0} className="rounded bg-primary-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Confirmar importacao</button>}</div>
  </div></div>;
}
