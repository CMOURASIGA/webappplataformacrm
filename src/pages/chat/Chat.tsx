import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { Send, Sparkles, FileText, Activity, MessagesSquare, Search, X } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';
import { useSearchParams } from 'react-router-dom';

import DOMPurify from 'dompurify';

function textToHtml(value: string) {
  return DOMPurify.sanitize(
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br />')
  );
}

function getAiErrorMessage(error: unknown, action: string) {
  const message = error instanceof Error ? error.message : '';
  if (/nao habilitada|nÃ£o habilitada/i.test(message)) {
    return `Nao foi possivel ${action}: a IA nao esta habilitada para este cliente.`;
  }
  if (/limite mensal/i.test(message)) {
    return `Nao foi possivel ${action}: o limite mensal de IA foi atingido.`;
  }
  return `Nao foi possivel ${action}. Verifique a configuracao da IA e tente novamente.`;
}

export default function Chat() {
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<'minhas' | 'fila' | 'todas' | 'abertas'>('minhas');

  const currentUser = useStore(state => state.currentUser);
  const activeTenantId = useStore(state => state.activeTenantId);
  const conversations = useStore(state => state.conversations);
  const leads = useStore(state => state.leads);
  const messages = useStore(state => state.messages);
  const pipelines = useStore(state => state.pipelines);
  const quickReplies = useStore(state => state.quickReplies);
  
  const addMessage = useStore(state => state.addMessage);
  const assignConversation = useStore(state => state.assignConversation);
  const updateConversationStatus = useStore(state => state.updateConversationStatus);
  const addConversation = useStore(state => state.addConversation);
  const moveLead = useStore(state => state.moveLead);
  const fetchMessages = useStore(state => state.fetchMessages);
  const setLeadClassification = useStore(state => state.setLeadClassification);

  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [aiClassification, setAiClassification] = useState<any>(null);
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false);
  const [quickReplySearch, setQuickReplySearch] = useState('');
  const [operationError, setOperationError] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleSuggestReply = async () => {
    if (!activeConversation) return;
    setIsAiLoading(true);
    try {
      const data = await fetchApi('/ai/suggest-reply', {
        method: 'POST',
        body: JSON.stringify({ conversationId: activeConversation.id }),
      });
      if (data.suggestion) {
        setText(text + (text ? '\n' : '') + data.suggestion);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar sugestão. Verifique se a IA está ativada e configurada.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!activeConversation) return;
    setIsAiLoading(true);
    setOperationError('');
    try {
      const data = await fetchApi('/ai/summarize-conversation', {
        method: 'POST',
        body: JSON.stringify({ conversationId: activeConversation.id }),
      });
      setAiSummary(data);
    } catch (err) {
      console.error('Summarize conversation failed:', err);
      setOperationError(getAiErrorMessage(err, 'resumir a conversa'));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleClassify = async () => {
    if (!activeLead) return;
    setIsAiLoading(true);
    setOperationError('');
    try {
      const data = await fetchApi('/ai/classify-lead', {
        method: 'POST',
        body: JSON.stringify({ leadId: activeLead.id }),
      });
      setAiClassification(data);
      setLeadClassification(activeLead.id, data.classification, data.classificationDetails || data, data.classifiedAt);
    } catch (err) {
      console.error('Classify lead failed:', err);
      setOperationError(getAiErrorMessage(err, 'classificar o lead'));
    } finally {
      setIsAiLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tenantId = currentUser?.role === 'master' ? activeTenantId : currentUser?.tenantId;
  const canViewAll = currentUser?.role === 'admin' || currentUser?.role === 'master';

  const tenantLeads = leads.filter(l => l.tenantId === tenantId);
  const tenantConversations = conversations.filter(c => c.tenantId === tenantId);
  const filteredConversations = tenantConversations.filter(c => {
    if (filter === 'minhas') return c.assignedTo === currentUser?.id;
    if (filter === 'fila') return !c.assignedTo || c.status === 'unassigned' || c.status === 'new';
    if (filter === 'abertas') return c.status !== 'closed';
    return true;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  const activeLead = activeLeadId ? tenantLeads.find(l => l.id === activeLeadId) : null;
  const activeConversation = activeLeadId ? tenantConversations.find(c => c.leadId === activeLeadId) : null;
  const activePipeline = activeLead ? pipelines.find(p => p.id === activeLead.pipelineId) : null;
  
  const activeMessages = activeConversation ? messages.filter(m => m.conversationId === activeConversation.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];

  useEffect(() => {
    setAiSummary(null);
    setAiClassification(activeLead?.classificationDetails || null);
    setOperationError('');
  }, [activeLead?.id]);

  useEffect(() => {
    if (activeConversation && (canViewAll || activeConversation.assignedTo === currentUser?.id)) {
      fetchMessages(activeConversation.id);
    }
  }, [activeConversation?.id, activeConversation?.assignedTo, canViewAll, currentUser?.id, fetchMessages]);

  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'minhas' || view === 'fila' || view === 'todas' || view === 'abertas') {
      setFilter(view);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeLeadId && !filteredConversations.some(conv => conv.leadId === activeLeadId)) {
      setActiveLeadId(filteredConversations[0]?.leadId || null);
      return;
    }
    if (!activeLeadId && filteredConversations.length > 0) {
      setActiveLeadId(filteredConversations[0].leadId);
    }
  }, [activeLeadId, filteredConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  if (!currentUser) return null;

  const handleSelectLead = async (leadId: string) => {
    setOperationError('');
    setActiveLeadId(leadId);
    const existing = tenantConversations.find(c => c.leadId === leadId);
    if (!existing && tenantId) {
      await addConversation(leadId, tenantId);
    }
  };

  const handleAssign = async () => {
    if (!activeConversation) return;
    setIsAssigning(true);
    setOperationError('');
    try {
      await assignConversation(activeConversation.id, currentUser.id);
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Não foi possível assumir a conversa.');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredQuickReplies = quickReplies.filter(reply => {
    const query = quickReplySearch.trim().toLocaleLowerCase('pt-BR');
    return !query || [reply.title, reply.text, reply.category].some(value => value?.toLocaleLowerCase('pt-BR').includes(query));
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const plainText = text.trim();
    if (plainText && activeConversation && currentUser) {
      addMessage(activeConversation.id, currentUser.id, textToHtml(plainText));
      setText('');
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex border border-slate-200 rounded-xl overflow-hidden bg-white shadow-lg">
      {/* Sidebar: Leads List */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/30">
        
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="font-bold text-slate-800 mb-4">Conversas</div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button onClick={() => setFilter('minhas')} className={cn("flex-1 text-xs py-1.5 rounded-md font-medium transition-colors", filter === 'minhas' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700')}>Minhas</button>
             <button onClick={() => setFilter('fila')} className={cn("flex-1 text-xs py-1.5 rounded-md font-medium transition-colors", filter === 'fila' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700')}>Fila</button>
             {canViewAll && <button onClick={() => setFilter('todas')} className={cn("flex-1 text-xs py-1.5 rounded-md font-medium transition-colors", filter === 'todas' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700')}>Todas</button>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map(conv => {
            const lead = tenantLeads.find(l => l.id === conv.leadId);
            const isActive = activeConversation?.id === conv.id;
            
            return (
              <div 
                key={conv.id} 
                onClick={() => {
                   if (lead) handleSelectLead(lead.id);
                }}
                className={cn(
                  "p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors bg-white",
                  isActive && "bg-primary-50/50 border-l-4 border-l-primary-600"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                   <div className="font-bold text-sm text-slate-800 truncate pr-2">{lead?.name || 'Desconhecido'}</div>
                   <div className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
                <div className="text-xs text-slate-500 truncate mb-2">{lead?.phone}</div>
                <div className="flex gap-2">
                   <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", 
                     conv.status === 'unassigned' || conv.status === 'new' ? 'bg-amber-100 text-amber-700' :
                     conv.status === 'closed' ? 'bg-slate-100 text-slate-600' :
                     'bg-emerald-100 text-emerald-700'
                   )}>
                     {conv.status === 'unassigned' || conv.status === 'new' ? 'Na Fila' : conv.status === 'closed' ? 'Encerrado' : 'Em Andamento'}
                   </span>
                </div>
              </div>
            );
          })}
          {filteredConversations.length === 0 && (
             <div className="p-8 text-center text-slate-400 text-sm">Nenhuma conversa encontrada.</div>
          )}
        </div>

      </div>

      {/* Main: Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeLead ? (
          <>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                    {activeLead.name.charAt(0)}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800">{activeLead.name}</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Online no WhatsApp</div>
                  {activeLead.classification && (
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Classificacao: <span className="text-primary-700">{activeLead.classification}</span>
                    </div>
                  )}
                </div>
                
                {activePipeline && (
                  <div className="ml-4 pl-4 border-l border-slate-200">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                      Funil: {activePipeline.name}
                    </label>
                    <select 
                      value={activeLead.stageId}
                      onChange={(e) => moveLead(activeLead.id, e.target.value)}
                      className="text-xs border-slate-300 rounded px-2 py-1 bg-white focus:ring-primary-500 focus:border-primary-500"
                    >
                      {activePipeline.stages.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleClassify} disabled={isAiLoading}>
                  <Activity size={14} className="mr-1" />
                  Classificar Lead
                </Button>
                <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isAiLoading}>
                  <FileText size={14} className="mr-1" />
                  Resumir
                </Button>
                
                {activeConversation && (!activeConversation.assignedTo || activeConversation.status === 'unassigned' || activeConversation.status === 'new') && (
                   <Button variant="outline" size="sm" onClick={handleAssign} disabled={isAssigning}>
                     {isAssigning ? 'Assumindo...' : 'Assumir'}
                   </Button>
                )}
                {activeConversation && activeConversation.status !== 'closed' && (
                   <Button variant="outline" size="sm" onClick={() => updateConversationStatus(activeConversation.id, 'closed', 'Resolvido')}>
                     Encerrar
                   </Button>
                )}
                {activeConversation && activeConversation.status === 'closed' && (
                   <Button variant="outline" size="sm" onClick={() => updateConversationStatus(activeConversation.id, 'reopened', '')}>
                     Reabrir
                   </Button>
                )}
              </div>
            </div>

            {operationError && (
              <div className="mx-4 mt-3 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {operationError}<button onClick={() => setOperationError('')} aria-label="Fechar aviso"><X size={16} /></button>
              </div>
            )}

            <div 
              className="flex-1 p-4 overflow-y-auto"
              style={{
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
                backgroundColor: '#f8fafc'
              }}
            >
              <div className="space-y-4">
                
                {(aiSummary || aiClassification) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-sm text-amber-900 shadow-sm relative">
                    <button onClick={() => { setAiSummary(null); setAiClassification(null); }} className="absolute top-2 right-2 text-amber-500 hover:text-amber-700">✕</button>
                    {aiClassification && (
                      <div className="mb-4">
                        <h4 className="font-bold mb-2 flex items-center gap-1"><Sparkles size={14}/> Classificação de IA</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><strong>Intenção:</strong> <span className="capitalize">{aiClassification.intencao}</span></div>
                          <div><strong>Temperatura:</strong> <span className="capitalize">{aiClassification.temperatura}</span></div>
                          <div><strong>Prioridade:</strong> <span className="capitalize">{aiClassification.prioridade}</span></div>
                          <div><strong>Sentimento:</strong> <span className="capitalize">{aiClassification.sentimento}</span></div>
                        </div>
                        {aiClassification.resumo_comercial && (
                          <div className="mt-2 text-xs"><strong>Resumo:</strong> {aiClassification.resumo_comercial}</div>
                        )}
                        {aiClassification.proxima_acao && (
                          <div className="mt-1 text-xs"><strong>Próxima ação sugerida:</strong> {aiClassification.proxima_acao}</div>
                        )}
                      </div>
                    )}
                    {aiSummary && (
                      <div>
                        <h4 className="font-bold mb-2 flex items-center gap-1"><Sparkles size={14}/> Resumo de IA</h4>
                        <p className="mb-2 text-xs">{aiSummary.resumo}</p>
                        {aiSummary.pontos_importantes?.length > 0 && (
                          <div className="mb-2">
                            <strong className="text-xs">Pontos Importantes:</strong>
                            <ul className="list-disc pl-4 text-xs">
                              {aiSummary.pontos_importantes.map((pt: string, i: number) => <li key={i}>{pt}</li>)}
                            </ul>
                          </div>
                        )}
                        {aiSummary.pendencias?.length > 0 && (
                          <div className="mb-2">
                            <strong className="text-xs">Pendências:</strong>
                            <ul className="list-disc pl-4 text-xs">
                              {aiSummary.pendencias.map((pt: string, i: number) => <li key={i}>{pt}</li>)}
                            </ul>
                          </div>
                        )}
                        {aiSummary.proxima_acao && (
                          <p className="text-xs"><strong>Próxima ação:</strong> {aiSummary.proxima_acao}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {!activeConversation && (
                  <div className="text-center text-sm text-slate-400 py-8">
                    Iniciando conversa...
                  </div>
                )}
                {activeConversation && activeMessages.map(msg => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[85%] p-3 text-sm prose prose-sm",
                        isMine 
                          ? "bg-primary-600 text-white rounded-2xl rounded-tr-none prose-invert" 
                          : "bg-slate-100 text-slate-700 rounded-2xl rounded-tl-none prose-slate"
                      )}>
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.text) }} />
                        <div className={cn("text-[9px] mt-1 block", isMine ? "text-primary-200 text-right" : "text-slate-400")}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSend} className="space-y-2">
                <div className="flex gap-2 pb-1 relative">
                    <button
                        type="button"
                        onClick={handleSuggestReply}
                        disabled={isAiLoading}
                        className="whitespace-nowrap text-[10px] bg-primary-50 text-primary-700 px-2 py-1 rounded border border-primary-200 hover:bg-primary-100 transition-colors flex items-center gap-1 font-semibold"
                      >
                        <Sparkles size={12} /> IA Sugerir
                      </button>
                    <button type="button" onClick={() => setQuickRepliesOpen(value => !value)} className="whitespace-nowrap text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 hover:bg-slate-200 flex items-center gap-1 font-semibold"><MessagesSquare size={12} /> Respostas rápidas</button>
                    {quickRepliesOpen && (
                      <div className="absolute bottom-8 left-0 z-20 w-96 max-w-[80vw] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                        <div className="relative mb-2"><Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" /><Input autoFocus value={quickReplySearch} onChange={event => setQuickReplySearch(event.target.value)} placeholder="Buscar por nome, conteúdo ou categoria" className="pl-8" /></div>
                        <div className="max-h-56 space-y-1 overflow-y-auto">
                          {filteredQuickReplies.map(reply => <button key={reply.id} type="button" onClick={() => { setText(current => `${current && current !== '<p><br></p>' ? `${current} ` : ''}${reply.text}`); setQuickRepliesOpen(false); }} className="w-full rounded-lg p-2 text-left hover:bg-slate-50"><span className="block text-xs font-bold text-slate-700">{reply.title}</span><span className="block text-[10px] text-primary-600">{reply.category || 'Geral'}</span><span className="block truncate text-xs text-slate-500">{reply.text}</span></button>)}
                          {filteredQuickReplies.length === 0 && <p className="py-4 text-center text-xs text-slate-500">Nenhuma resposta encontrada.</p>}
                        </div>
                      </div>
                    )}
                  </div>
                <div className="flex gap-2 items-end bg-white p-2 rounded-lg border border-slate-200 shadow-sm relative">
                  <div className="flex-1">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      readOnly={!activeConversation}
                      placeholder="Digite uma mensagem..."
                      rows={2}
                      className="w-full min-h-[40px] max-h-[120px] resize-y border-0 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400 disabled:opacity-60"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!text.trim() || !activeConversation}
                    className="p-2 mb-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Selecione um lead para iniciar
          </div>
        )}
      </div>
    </div>
  );
}
