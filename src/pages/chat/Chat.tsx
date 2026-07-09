import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { Send, User as UserIcon, Plus, Sparkles, FileText, Activity } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';

import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function Chat() {
  const currentUser = useStore(state => state.currentUser);
  const activeTenantId = useStore(state => state.activeTenantId);
  const conversations = useStore(state => state.conversations);
  const leads = useStore(state => state.leads);
  const messages = useStore(state => state.messages);
  const pipelines = useStore(state => state.pipelines);
  
  const addMessage = useStore(state => state.addMessage);
  const assignConversation = useStore(state => state.assignConversation);
  const updateConversationStatus = useStore(state => state.updateConversationStatus);
  const addConversation = useStore(state => state.addConversation);
  const moveLead = useStore(state => state.moveLead);
  const fetchMessages = useStore(state => state.fetchMessages);

  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [aiClassification, setAiClassification] = useState<any>(null);

  const handleSuggestReply = async () => {
    if (!activeConversation) return;
    setIsAiLoading(true);
    try {
      const data = await fetchApi('/ai/suggest-reply', {
        method: 'POST',
        body: JSON.stringify({ conversationId: activeConversation.id }),
      });
      if (data.suggestion) {
        setText(text + (text ? ' ' : '') + data.suggestion);
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
    try {
      const data = await fetchApi('/ai/summarize-conversation', {
        method: 'POST',
        body: JSON.stringify({ conversationId: activeConversation.id }),
      });
      setAiSummary(data);
    } catch (err) {
      console.error(err);
      alert('Erro ao resumir conversa.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleClassify = async () => {
    if (!activeLead) return;
    setIsAiLoading(true);
    try {
      const data = await fetchApi('/ai/classify-lead', {
        method: 'POST',
        body: JSON.stringify({ leadId: activeLead.id }),
      });
      setAiClassification(data);
    } catch (err) {
      console.error(err);
      alert('Erro ao classificar lead.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!currentUser) return null;

  const tenantId = currentUser.role === 'master' ? activeTenantId : currentUser.tenantId;

  const tenantLeads = leads.filter(l => l.tenantId === tenantId);
  const tenantConversations = conversations.filter(c => c.tenantId === tenantId);
  
  const activeLead = activeLeadId ? tenantLeads.find(l => l.id === activeLeadId) : null;
  const activeConversation = activeLeadId ? tenantConversations.find(c => c.leadId === activeLeadId) : null;
  const activePipeline = activeLead ? pipelines.find(p => p.id === activeLead.pipelineId) : null;
  
  const activeMessages = activeConversation ? messages.filter(m => m.conversationId === activeConversation.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];

  const quickReplies = useStore(state => state.quickReplies);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    }
  }, [activeConversation?.id, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSelectLead = async (leadId: string) => {
    setActiveLeadId(leadId);
    const existing = tenantConversations.find(c => c.leadId === leadId);
    if (!existing && tenantId) {
      await addConversation(leadId, tenantId);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && activeConversation && currentUser) {
      addMessage(activeConversation.id, currentUser.id, text.trim());
      setText('');
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex border border-slate-200 rounded-xl overflow-hidden bg-white shadow-lg">
      {/* Sidebar: Leads List */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/30">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 font-bold text-slate-800">
          Leads / Conversas
        </div>
        <div className="flex-1 overflow-y-auto">
          {tenantLeads.map(lead => {
            const isActive = activeLeadId === lead.id;
            const conv = tenantConversations.find(c => c.leadId === lead.id);
            const leadPipeline = pipelines.find(p => p.id === lead.pipelineId);
            const stageName = leadPipeline?.stages.find(s => s.id === lead.stageId)?.name || 'Sem funil';
            
            return (
              <div 
                key={lead.id} 
                onClick={() => handleSelectLead(lead.id)}
                className={cn(
                  "p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors",
                  isActive && "bg-primary-50 border-l-4 border-l-primary-600"
                )}
              >
                <div className="font-bold text-sm text-slate-800">{lead.name}</div>
                <div className="text-[11px] text-slate-500 mt-1 capitalize font-medium">
                  {stageName} {conv ? '• ' + conv.status.replace('_', ' ') : '• Sem conversa'}
                </div>
              </div>
            );
          })}
          {tenantLeads.length === 0 && (
            <div className="p-4 text-center text-sm text-slate-500">Nenhum lead encontrado.</div>
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
                   <Button variant="outline" size="sm" onClick={() => assignConversation(activeConversation.id, currentUser!.id)}>
                     Assumir
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
                                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                        type="button"
                        onClick={handleSuggestReply}
                        disabled={isAiLoading}
                        className="whitespace-nowrap text-[10px] bg-primary-50 text-primary-700 px-2 py-1 rounded border border-primary-200 hover:bg-primary-100 transition-colors flex items-center gap-1 font-semibold"
                      >
                        <Sparkles size={12} /> IA Sugerir
                      </button>
                    {quickReplies.length > 0 && quickReplies.map(qr => (
                      <button
                        key={qr.id}
                        type="button"
                        onClick={() => setText(qr.text)}
                        className="whitespace-nowrap text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                      >
                        {qr.title}
                      </button>
                    ))}
                  </div>
                <div className="flex gap-2 items-end bg-white p-2 rounded-lg border border-slate-200 shadow-sm relative">
                  <div className="flex-1">
                    <ReactQuill 
                      theme="snow"
                      value={text} 
                      onChange={setText} 
                      readOnly={!activeConversation}
                      modules={{ toolbar: false }}
                      placeholder="Digite uma mensagem..."
                      className="border-none [&_.ql-container]:border-none [&_.ql-editor]:min-h-[40px] [&_.ql-editor]:max-h-[120px] [&_.ql-editor]:py-2 [&_.ql-editor]:px-2 text-sm"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!text.trim() || text === '<p><br></p>' || !activeConversation}
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
