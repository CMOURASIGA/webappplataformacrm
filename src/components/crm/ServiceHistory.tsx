import React, { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, Filter, Loader2 } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export interface ServiceRecord {
  id: string;
  source: string;
  channel: string;
  started_at: string;
  ended_at: string;
  summary: string;
  attendantName?: string;
  message_count: number;
  pendingItems: string[];
  next_action?: string;
  next_action_due_at?: string;
  sentiment?: string;
  created_at: string;
}

export function ServiceHistory({ leadId, refreshKey = 0 }: { leadId: string; refreshKey?: number }) {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [period, setPeriod] = useState('all');
  const [pending, setPending] = useState(false);
  const [nextAction, setNextAction] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const query = new URLSearchParams({ period });
    if (pending) query.set('pending', 'true');
    if (nextAction) query.set('nextAction', 'true');
    setLoading(true); setError('');
    fetchApi(`/leads/${leadId}/service-records?${query}`)
      .then(setRecords)
      .catch(error => setError(error.message))
      .finally(() => setLoading(false));
  }, [leadId, period, pending, nextAction, refreshKey]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <Filter size={14} className="text-slate-400" />
        <select value={period} onChange={event => setPeriod(event.target.value)} className="h-8 rounded border border-slate-300 bg-white px-2 text-xs">
          <option value="all">Todos</option><option value="today">Hoje</option><option value="7days">Ultimos 7 dias</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={pending} onChange={event => setPending(event.target.checked)} /> Com pendencias</label>
        <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={nextAction} onChange={event => setNextAction(event.target.checked)} /> Com proxima acao</label>
      </div>

      {loading && <div className="flex justify-center py-10 text-slate-400"><Loader2 className="animate-spin" size={20} /></div>}
      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {!loading && !error && records.length === 0 && <div className="py-10 text-center text-sm text-slate-500">Nenhum registro de atendimento encontrado.</div>}
      {!loading && records.map(record => (
        <article key={record.id} className="border-l-2 border-primary-500 pl-4 pb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700"><CalendarClock size={14} /> {new Date(record.started_at).toLocaleString()} a {new Date(record.ended_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <p className="mt-1 text-[11px] text-slate-500">{record.attendantName || 'Usuario'} · {record.channel} · {record.message_count} mensagens · criado em {new Date(record.created_at).toLocaleString()}</p>
            </div>
            {record.sentiment && <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">{record.sentiment}</span>}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{record.summary}</p>
          {record.pendingItems?.length > 0 && <div className="mt-3 rounded bg-amber-50 p-3"><p className="text-[10px] font-bold uppercase text-amber-700">Pendencias</p>{record.pendingItems.map((item, index) => <p key={index} className="mt-1 text-xs text-amber-900">• {item}</p>)}</div>}
          {record.next_action && <div className="mt-2 flex items-start gap-2 rounded bg-emerald-50 p-3 text-xs text-emerald-900"><CheckCircle2 size={14} className="mt-0.5 shrink-0" /><span><strong>Proxima acao:</strong> {record.next_action}{record.next_action_due_at ? ` ate ${new Date(record.next_action_due_at).toLocaleString()}` : ''}</span></div>}
        </article>
      ))}
    </div>
  );
}
