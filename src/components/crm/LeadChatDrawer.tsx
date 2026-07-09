import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { Send, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface LeadChatDrawerProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadChatDrawer({ leadId, isOpen, onClose }: LeadChatDrawerProps) {
  const currentUser = useStore(state => state.currentUser);
  const conversations = useStore(state => state.conversations);
  const leads = useStore(state => state.leads);
  const messages = useStore(state => state.messages);
  
  const addMessage = useStore(state => state.addMessage);
  const addConversation = useStore(state => state.addConversation);
  const fetchMessages = useStore(state => state.fetchMessages);

  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lead = leadId ? leads.find(l => l.id === leadId) : null;
  const conversation = leadId ? conversations.find(c => c.leadId === leadId) : null;
  
  const activeMessages = conversation ? messages.filter(m => m.conversationId === conversation.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];

  useEffect(() => {
    if (isOpen && leadId && currentUser) {
      if (!conversation) {
        addConversation(leadId, currentUser.tenantId as string);
      } else {
        fetchMessages(conversation.id);
      }
    }
  }, [isOpen, leadId, conversation, currentUser, addConversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && conversation && currentUser) {
      addMessage(conversation.id, currentUser.id, text.trim());
      setText('');
    }
  };

  if (!isOpen || !currentUser) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 translate-x-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                {lead?.name.charAt(0)}
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <div className="font-bold text-sm text-slate-800">{lead?.name}</div>
              <div className="text-[11px] text-emerald-600 font-medium">Chat via WhatsApp</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div 
          className="flex-1 p-4 overflow-y-auto"
          style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
            backgroundColor: '#f8fafc'
          }}
        >
          <div className="space-y-4">
            {!conversation && (
              <div className="text-center text-sm text-slate-400 py-8">
                Iniciando conversa...
              </div>
            )}
            {conversation && activeMessages.map(msg => {
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
              disabled={!conversation}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none px-2 disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={!text.trim() || !conversation}
              className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
