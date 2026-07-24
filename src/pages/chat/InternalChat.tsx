import React, { useMemo, useState } from 'react';
import { MessageCircleMore, Plus, Send, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useStore } from '../../store';
import type { InternalChannelType } from '../../types';
import { cn } from '../../lib/utils';

export default function InternalChat() {
  const currentUser = useStore(state => state.currentUser);
  const users = useStore(state => state.users);
  const leads = useStore(state => state.leads);
  const channels = useStore(state => state.internalChannels);
  const messages = useStore(state => state.internalMessages);
  const createChannel = useStore(state => state.createInternalChannel);
  const addMessage = useStore(state => state.addInternalMessage);
  const tenantId = currentUser?.tenantId || useStore.getState().activeTenantId || 'tenant-1';
  const tenantUsers = users.filter(user => user.tenantId === tenantId && user.id !== currentUser?.id);
  const tenantLeads = leads.filter(lead => lead.tenantId === tenantId);
  const visibleChannels = channels.filter(channel => channel.tenantId === tenantId && channel.participantIds.includes(currentUser?.id || ''));

  const [activeId, setActiveId] = useState<string | null>(visibleChannels[0]?.id || null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<InternalChannelType>('private_group');
  const [participants, setParticipants] = useState<string[]>([]);
  const [leadId, setLeadId] = useState('');
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState('');
  const active = visibleChannels.find(channel => channel.id === activeId);
  const activeMessages = useMemo(() => messages.filter(message => message.channelId === activeId), [messages, activeId]);

  if (!currentUser) return null;

  const submitChannel = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return setFeedback('Informe o nome do canal.');
    if (type !== 'direct' && participants.length === 0) return setFeedback('Selecione ao menos um participante para criar este canal.');
    if (type === 'direct' && participants.length !== 1) return setFeedback('Selecione exatamente um participante para a conversa direta.');
    if (type === 'lead_discussion' && !leadId) return setFeedback('Selecione o lead vinculado à discussão.');
    await createChannel({ tenantId, name: name.trim(), description: description.trim(), type, participantIds: [currentUser.id, ...participants], leadId: leadId || undefined, createdBy: currentUser.id });
    setName(''); setDescription(''); setParticipants([]); setLeadId(''); setShowForm(false);
    setFeedback('Canal interno criado com sucesso.');
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!active || !text.trim()) return;
    await addMessage(active.id, text.trim());
    setText('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold uppercase tracking-tight text-slate-700">Chat interno</h1><p className="text-sm text-slate-500">Conversas da equipe, nunca enviadas ao cliente.</p></div>
        <Button onClick={() => setShowForm(true)}><Plus size={16} className="mr-1" /> Nova conversa</Button>
      </div>
      {feedback && <div className="flex justify-between rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800">{feedback}<button onClick={() => setFeedback('')}><X size={16} /></button></div>}
      <div className="flex h-[calc(100vh-13rem)] overflow-hidden rounded-xl border border-slate-200 bg-white">
        <aside className="w-80 border-r border-slate-200 bg-slate-50">
          {visibleChannels.map(channel => <button key={channel.id} onClick={() => setActiveId(channel.id)} className={cn('block w-full border-b border-slate-200 p-4 text-left hover:bg-white', activeId === channel.id && 'bg-white border-l-4 border-l-primary-600')}><span className="block text-sm font-bold text-slate-800">{channel.name}</span><span className="text-xs text-slate-500">{channel.type === 'lead_discussion' ? 'Discussão de lead' : channel.description || 'Canal interno'}</span></button>)}
          {!visibleChannels.length && <p className="p-8 text-center text-sm text-slate-400">Nenhum canal criado.</p>}
        </aside>
        <main className="flex flex-1 flex-col">
          {active ? <><header className="border-b border-slate-200 p-4"><h2 className="font-bold">{active.name}</h2><p className="text-xs text-slate-500">{active.description}</p></header><div className="flex-1 space-y-3 overflow-y-auto p-4">{activeMessages.map(message => { const mine = message.senderId === currentUser.id; const author = users.find(user => user.id === message.senderId); return <div key={message.id} className={cn('flex', mine && 'justify-end')}><div className={cn('max-w-[75%] rounded-xl px-3 py-2 text-sm', mine ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700')}><span className="block text-[10px] font-bold opacity-70">{author?.name}</span>{message.text}<span className="mt-1 block text-[9px] opacity-60">{new Date(message.createdAt).toLocaleString('pt-BR')}</span></div></div>})}</div><form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-4"><Input value={text} onChange={event => setText(event.target.value)} placeholder="Mensagem interna..." /><Button type="submit" disabled={!text.trim()}><Send size={16} /></Button></form></> : <div className="flex flex-1 items-center justify-center text-slate-400"><MessageCircleMore className="mr-2" /> Selecione ou crie uma conversa</div>}
        </main>
      </div>
      {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><form onSubmit={submitChannel} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl"><div className="flex justify-between"><h2 className="text-lg font-bold">Nova conversa interna</h2><button type="button" onClick={() => setShowForm(false)}><X /></button></div><label className="block text-sm font-bold">Nome *<Input value={name} onChange={event => setName(event.target.value)} /></label><label className="block text-sm font-bold">Descrição<Input value={description} onChange={event => setDescription(event.target.value)} /></label><label className="block text-sm font-bold">Tipo<select value={type} onChange={event => setType(event.target.value as InternalChannelType)} className="mt-1 w-full rounded-md border border-slate-300 p-2 font-normal"><option value="direct">Conversa direta</option><option value="private_group">Grupo privado</option><option value="team_channel">Canal da equipe</option><option value="lead_discussion">Discussão vinculada a lead</option></select></label>{type === 'lead_discussion' && <label className="block text-sm font-bold">Lead *<select value={leadId} onChange={event => setLeadId(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2 font-normal"><option value="">Selecione</option>{tenantLeads.map(lead => <option key={lead.id} value={lead.id}>{lead.name}</option>)}</select></label>}<fieldset><legend className="text-sm font-bold">Participantes *</legend><div className="mt-2 grid grid-cols-2 gap-2">{tenantUsers.map(user => <label key={user.id} className="flex items-center gap-2 rounded border border-slate-200 p-2 text-sm"><input type="checkbox" checked={participants.includes(user.id)} onChange={event => setParticipants(current => event.target.checked ? [...current, user.id] : current.filter(id => id !== user.id))} />{user.name}</label>)}</div></fieldset>{feedback && <p className="text-sm text-red-600">{feedback}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit">Criar canal</Button></div></form></div>}
    </div>
  );
}
