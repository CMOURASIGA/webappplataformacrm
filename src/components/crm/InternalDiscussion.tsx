import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, FileCheck2, Loader2, RotateCcw, Send } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { useStore } from '../../store';

export function InternalDiscussion({ leadId, onDecisionSaved }: { leadId: string; onDecisionSaved?: () => void }) {
  const currentUser = useStore(state => state.currentUser);
  const [channel, setChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decision, setDecision] = useState({ summary: '', decisions: '', pendingItems: '', nextAction: '', nextActionDueAt: '' });
  const endRef = useRef<HTMLDivElement>(null);

  const loadMessages = async (channelId: string) => {
    const data = await fetchApi(`/internal/channels/${channelId}/messages`);
    setMessages(data);
    await fetchApi(`/internal/channels/${channelId}/read`, { method: 'POST', body: '{}' });
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchApi(`/leads/${leadId}/internal-channel`)
      .then(async data => {
        setChannel(data);
        await loadMessages(data.id);
      })
      .catch((err: any) => {
        setError(err.message || 'Nao foi possivel carregar a discussao interna deste lead.');
      })
      .finally(() => setLoading(false));
  }, [leadId]);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault(); if (!text.trim() || !channel) return;
    try {
      const message = await fetchApi(`/internal/channels/${channel.id}/messages`, { method: 'POST', body: JSON.stringify({ text: text.trim() }) });
      setMessages(items => [...items, message]); setText(''); setError('');
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel enviar a mensagem.');
    }
  };

  const saveDecision = async () => {
    if (!channel || !decision.summary.trim()) return;
    setSaving(true);
    setError('');
    try {
      await fetchApi(`/internal/channels/${channel.id}/service-record`, { method: 'POST', body: JSON.stringify({ summary: decision.summary, decisions: decision.decisions.split('\n').filter(Boolean), pendingItems: decision.pendingItems.split('\n').filter(Boolean), nextAction: decision.nextAction, nextActionDueAt: decision.nextActionDueAt || null }) });
      setDecisionOpen(false); setDecision({ summary: '', decisions: '', pendingItems: '', nextAction: '', nextActionDueAt: '' }); onDecisionSaved?.();
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel registrar a decisao.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div>;
  return (
    <div className="relative flex h-full min-h-[420px] flex-col">
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
        <div><p className="text-sm font-bold text-slate-800">Discussao privada</p><p className="text-[11px] text-slate-500">Mensagens internas nunca sao enviadas ao lead. Use @Nome para mencionar.</p></div>
        <button disabled={!channel} onClick={() => { setDecision({ ...decision, summary: messages.slice(-5).map(message => `${message.sender_name}: ${message.text}`).join('\n') }); setDecisionOpen(true); }} className="flex items-center gap-1.5 rounded border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><FileCheck2 size={14} /> Registrar decisao</button>
      </div>
      {error && <div className="mb-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><div className="flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{error}</span></div><button onClick={() => window.location.reload()} className="mt-2 flex items-center gap-1 text-[11px] font-bold underline"><RotateCcw size={12} /> Recarregar</button></div>}
      {!channel && !error && !loading && <div className="mb-3 rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">Nao foi possivel abrir um canal de discussao para este lead.</div>}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Inicie a discussao interna deste lead.</p>}
        {messages.map(message => <div key={message.id} className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-md px-3 py-2 ${message.sender_id === currentUser?.id ? 'bg-slate-800 text-white' : message.mentioned_me ? 'border border-amber-300 bg-amber-50 text-slate-800' : 'bg-slate-100 text-slate-800'}`}><p className="text-[10px] font-bold opacity-70">{message.sender_name}</p><p className="whitespace-pre-wrap text-sm">{message.text}</p><p className="mt-1 text-[9px] opacity-60">{new Date(message.created_at).toLocaleString()}</p></div></div>)}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2 border-t border-slate-200 pt-3"><textarea value={text} onChange={event => setText(event.target.value)} rows={2} placeholder="Mensagem interna..." className="flex-1 resize-none rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500" /><button type="submit" disabled={!text.trim() || !channel || saving} title="Enviar mensagem interna" className="self-end rounded bg-slate-800 p-2.5 text-white disabled:opacity-40"><Send size={17} /></button></form>

      {decisionOpen && <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/30 p-5"><div className="w-full max-w-lg rounded-md bg-white p-5 shadow-xl"><h3 className="font-bold text-slate-800">Registrar decisao no historico</h3><p className="mt-1 text-xs text-slate-500">Revise o conteudo antes de criar o registro oficial.</p><div className="mt-4 space-y-3"><label className="block text-xs font-bold text-slate-600">Resumo<textarea value={decision.summary} onChange={event => setDecision({ ...decision, summary: event.target.value })} rows={5} className="mt-1 w-full rounded border border-slate-300 p-2 text-sm font-normal" /></label><label className="block text-xs font-bold text-slate-600">Decisoes, uma por linha<textarea value={decision.decisions} onChange={event => setDecision({ ...decision, decisions: event.target.value })} rows={2} className="mt-1 w-full rounded border border-slate-300 p-2 text-sm font-normal" /></label><label className="block text-xs font-bold text-slate-600">Pendencias, uma por linha<textarea value={decision.pendingItems} onChange={event => setDecision({ ...decision, pendingItems: event.target.value })} rows={2} className="mt-1 w-full rounded border border-slate-300 p-2 text-sm font-normal" /></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-600">Proxima acao<input value={decision.nextAction} onChange={event => setDecision({ ...decision, nextAction: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2 text-sm font-normal" /></label><label className="text-xs font-bold text-slate-600">Prazo<input type="datetime-local" value={decision.nextActionDueAt} onChange={event => setDecision({ ...decision, nextActionDueAt: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2 text-sm font-normal" /></label></div></div><div className="mt-5 flex justify-end gap-2"><button onClick={() => setDecisionOpen(false)} className="rounded px-3 py-2 text-sm text-slate-600">Cancelar</button><button onClick={saveDecision} disabled={!decision.summary.trim() || saving} className="rounded bg-primary-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-40">Salvar no historico</button></div></div></div>}
    </div>
  );
}
