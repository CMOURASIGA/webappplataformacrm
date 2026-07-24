import React, { useEffect, useRef, useState } from 'react';
import { Bot, Clock3, FileText, Loader2, MessageCircle, Send, UserRound, Users, X } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useStore } from '../../store';
import { fetchApi } from '../../lib/api';
import { cn } from '../../lib/utils';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { ServiceHistory } from './ServiceHistory';
import { InternalDiscussion } from './InternalDiscussion';

type Tab = 'conversation' | 'history' | 'internal' | 'data';
const listText = (value: string) => value.split('\n').map(item => item.trim().replace(/^[-•]\s*/, '')).filter(Boolean);
const listValue = (value: unknown) => Array.isArray(value) ? value.join('\n') : '';

export function LeadChatDrawer({ leadId, isOpen, onClose, initialTab = 'conversation' }: { leadId: string | null; isOpen: boolean; onClose: () => void; initialTab?: Tab }) {
  const currentUser = useStore(state => state.currentUser);
  const conversations = useStore(state => state.conversations);
  const leads = useStore(state => state.leads);
  const messages = useStore(state => state.messages);
  const addMessage = useStore(state => state.addMessage);
  const addConversation = useStore(state => state.addConversation);
  const fetchMessages = useStore(state => state.fetchMessages);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(0);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [historyKey, setHistoryKey] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  const lead = leadId ? leads.find(item => item.id === leadId) : null;
  const conversation = leadId ? conversations.find(item => item.leadId === leadId) : null;
  const activeMessages = conversation ? messages.filter(item => item.conversationId === conversation.id).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)) : [];

  const refreshPending = async () => {
    if (!conversation) return setPending(0);
    try {
      const data = await fetchApi(`/conversations/${conversation.id}/unregistered-messages`);
      setPending(data.count);
    } catch {
      setPending(0);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setTab(initialTab);
    if (leadId && currentUser && !conversation) addConversation(leadId, currentUser.tenantId as string);
    else if (conversation) {
      fetchMessages(conversation.id);
      refreshPending();
    }
  }, [isOpen, leadId, conversation?.id, initialTab]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [activeMessages]);

  if (!isOpen || !leadId || !currentUser || !lead) return null;

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim() || !conversation) return;
    const safe = DOMPurify.sanitize(text.trim().replace(/\n/g, '<br />'));
    await addMessage(conversation.id, currentUser.id, safe);
    setText('');
    await refreshPending();
  };

  const generate = async () => {
    if (!conversation) return;
    setGenerating(true);
    setError('');
    setRegisterOpen(true);
    try {
      const data = await fetchApi(`/conversations/${conversation.id}/service-records/preview`, { method: 'POST', body: '{}' });
      setPreview({
        ...data,
        topicsText: listValue(data.topics),
        needsText: listValue(data.needs),
        objectionsText: listValue(data.objections),
        decisionsText: listValue(data.decisions),
        pendingText: listValue(data.pendingItems),
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const saveRecord = async () => {
    if (!conversation || !preview) return;
    setGenerating(true);
    setError('');
    try {
      await fetchApi(`/conversations/${conversation.id}/service-records`, {
        method: 'POST',
        body: JSON.stringify({
          ...preview,
          topics: listText(preview.topicsText),
          needs: listText(preview.needsText),
          objections: listText(preview.objectionsText),
          decisions: listText(preview.decisionsText),
          pendingItems: listText(preview.pendingText),
        }),
      });
      setRegisterOpen(false);
      setPreview(null);
      setHistoryKey(value => value + 1);
      setTab('history');
      await refreshPending();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const tabs: Array<[Tab, string, React.ReactNode]> = [
    ['conversation', 'Conversa', <MessageCircle size={14} />],
    ['history', 'Historico', <Clock3 size={14} />],
    ['internal', 'Discussao interna', <Users size={14} />],
    ['data', 'Dados', <UserRound size={14} />],
  ];

  return <>
    <div className="fixed inset-0 z-40 bg-slate-900/20" onClick={onClose} />
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <p className="font-bold text-slate-900">{lead.name}</p>
          <p className="text-xs text-slate-500">{lead.company || lead.phone}</p>
        </div>
        <button title="Fechar" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
          <X size={20} />
        </button>
      </header>

      <nav className="flex overflow-x-auto border-b border-slate-200 px-3">
        {tabs.map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn('flex h-11 items-center gap-1.5 border-b-2 px-3 text-xs font-bold', tab === key ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500')}
          >
            {icon}{label}
          </button>
        ))}
      </nav>

      <div className="relative flex-1 min-h-0 overflow-y-auto p-5">
        {tab === 'conversation' && <div className="flex h-full min-h-[460px] flex-col">
          <div className="mb-3 flex items-center justify-between rounded bg-slate-50 p-3">
            <div>
              <p className="text-xs font-bold text-slate-700">{pending ? `${pending} mensagens ainda nao registradas` : 'Nao existem novas mensagens para registrar.'}</p>
              <p className="text-[10px] text-slate-500">Somente o ciclo pendente sera analisado.</p>
            </div>
            <button onClick={generate} disabled={!pending || generating} className="flex items-center gap-1.5 rounded bg-primary-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
              <Bot size={14} /> Registrar atendimento
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto rounded bg-slate-50 p-3">
            {!conversation && <p className="py-10 text-center text-sm text-slate-400">Iniciando conversa...</p>}
            {activeMessages.map(message => {
              const mine = message.senderId === currentUser.id;
              return (
                <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[85%] rounded-md px-3 py-2 text-sm', mine ? 'bg-primary-600 text-white' : 'bg-white text-slate-700 shadow-sm')}>
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.text) }} />
                    <p className="mt-1 text-right text-[9px] opacity-60">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="mt-3 flex gap-2">
            <textarea value={text} onChange={event => setText(event.target.value)} disabled={!conversation} rows={2} placeholder="Digite uma mensagem para o lead..." className="flex-1 resize-none rounded border border-slate-300 px-3 py-2 text-sm" />
            <button title="Enviar ao lead" disabled={!text.trim() || !conversation} className="self-end rounded bg-primary-600 p-2.5 text-white disabled:opacity-40">
              <Send size={17} />
            </button>
          </form>
        </div>}

        {tab === 'history' && <ServiceHistory leadId={leadId} refreshKey={historyKey} />}
        {tab === 'internal' && <ErrorBoundary title="Nao foi possivel exibir a discussao interna"><InternalDiscussion leadId={leadId} onDecisionSaved={() => setHistoryKey(value => value + 1)} /></ErrorBoundary>}
        {tab === 'data' && <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['Nome', lead.name],
            ['Telefone', lead.phone],
            ['E-mail', lead.email || '-'],
            ['Empresa', lead.company || '-'],
            ['Origem', lead.source],
            ['Status', lead.status],
            ['Observacoes', lead.notes || '-'],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-slate-100 pb-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
              <p className="mt-1 text-sm text-slate-800">{value}</p>
            </div>
          ))}
        </div>}
      </div>
    </aside>

    {registerOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-md bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800">Revisar registro de atendimento</h2>
            {preview && <p className="text-xs text-slate-500">{preview.messageCount} mensagens · {new Date(preview.startedAt).toLocaleString()} a {new Date(preview.endedAt).toLocaleString()}</p>}
          </div>
          <button onClick={() => { setRegisterOpen(false); setPreview(null); }}>
            <X size={20} />
          </button>
        </div>

        {generating && !preview && <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><Loader2 className="animate-spin" /> Gerando previa com IA...</div>}
        {error && <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {preview && <div className="mt-5 space-y-3">
          <Field label="Resumo" value={preview.summary || ''} onChange={summary => setPreview({ ...preview, summary })} rows={5} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Assuntos tratados" value={preview.topicsText} onChange={topicsText => setPreview({ ...preview, topicsText })} />
            <Field label="Necessidades" value={preview.needsText} onChange={needsText => setPreview({ ...preview, needsText })} />
            <Field label="Objecoes" value={preview.objectionsText} onChange={objectionsText => setPreview({ ...preview, objectionsText })} />
            <Field label="Decisoes" value={preview.decisionsText} onChange={decisionsText => setPreview({ ...preview, decisionsText })} />
            <Field label="Pendencias" value={preview.pendingText} onChange={pendingText => setPreview({ ...preview, pendingText })} />
            <Field label="Proxima acao" value={preview.nextAction || ''} onChange={nextAction => setPreview({ ...preview, nextAction })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-600">Prazo da proxima acao
              <input type="datetime-local" value={preview.nextActionDueAt?.slice(0, 16) || ''} onChange={event => setPreview({ ...preview, nextActionDueAt: event.target.value || null })} className="mt-1 w-full rounded border border-slate-300 p-2 font-normal" />
            </label>
            <label className="text-xs font-bold text-slate-600">Sentimento
              <input value={preview.sentiment || ''} onChange={event => setPreview({ ...preview, sentiment: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2 font-normal" />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button onClick={() => setRegisterOpen(false)} className="rounded px-4 py-2 text-sm text-slate-600">Cancelar</button>
            <button onClick={saveRecord} disabled={generating || !preview.summary?.trim()} className="flex items-center gap-2 rounded bg-primary-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
              <FileText size={15} /> Confirmar registro
            </button>
          </div>
        </div>}
      </div>
    </div>}
  </>;
}

function Field({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <label className="block text-xs font-bold text-slate-600">{label}<textarea value={value} onChange={event => onChange(event.target.value)} rows={rows} className="mt-1 w-full resize-y rounded border border-slate-300 p-2 text-sm font-normal" /></label>;
}
