import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { Send, User as UserIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';

export default function Chat() {
  const currentUser = useStore(state => state.currentUser);
  const conversations = useStore(state => state.conversations);
  const leads = useStore(state => state.leads);
  const messages = useStore(state => state.messages);
  const addMessage = useStore(state => state.addMessage);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!currentUser) return null;

  const tenantConversations = conversations.filter(c => c.tenantId === currentUser.tenantId);
  
  const activeConversation = tenantConversations.find(c => c.id === activeConversationId);
  const activeLead = activeConversation ? leads.find(l => l.id === activeConversation.leadId) : null;
  const activeMessages = activeConversation ? messages.filter(m => m.conversationId === activeConversation.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && activeConversationId && currentUser) {
      addMessage(activeConversationId, currentUser.id, text.trim());
      setText('');
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex border border-slate-200 rounded-xl overflow-hidden bg-white shadow-lg">
      {/* Sidebar: Conversation List */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/30">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 font-bold text-slate-800">
          Conversas
        </div>
        <div className="flex-1 overflow-y-auto">
          {tenantConversations.map(conv => {
            const lead = leads.find(l => l.id === conv.leadId);
            const isActive = activeConversationId === conv.id;
            return (
              <div 
                key={conv.id} 
                onClick={() => setActiveConversationId(conv.id)}
                className={cn(
                  "p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors",
                  isActive && "bg-indigo-50 border-l-4 border-l-indigo-600"
                )}
              >
                <div className="font-bold text-sm text-slate-800">{lead?.name || 'Unknown'}</div>
                <div className="text-[11px] text-slate-500 mt-1 capitalize font-medium">Status: {conv.status.replace('_', ' ')}</div>
              </div>
            );
          })}
          {tenantConversations.length === 0 && (
            <div className="p-4 text-center text-sm text-slate-500">Nenhuma conversa encontrada.</div>
          )}
        </div>
      </div>

      {/* Main: Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation && activeLead ? (
          <>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {activeLead.name.charAt(0)}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800">{activeLead.name}</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Online no WhatsApp</div>
                </div>
              </div>
              <Button variant="outline" size="sm">Encerrar Atendimento</Button>
            </div>

            <div 
              className="flex-1 p-4 overflow-y-auto"
              style={{
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
                backgroundColor: '#f8fafc' // slate-50
              }}
            >
              <div className="space-y-4">
                {activeMessages.map(msg => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[85%] p-3 text-sm",
                        isMine 
                          ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none" 
                          : "bg-slate-100 text-slate-700 rounded-2xl rounded-tl-none"
                      )}>
                        {msg.text}
                        <div className={cn("text-[9px] mt-1 block", isMine ? "text-indigo-200 text-right" : "text-slate-400")}>
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
              <form onSubmit={handleSend} className="flex gap-2 items-center bg-slate-100 p-2 rounded-lg border border-slate-200">
                <input 
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none px-2"
                />
                <button 
                  type="submit" 
                  disabled={!text.trim()}
                  className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Selecione uma conversa para iniciar
          </div>
        )}
      </div>
    </div>
  );
}
