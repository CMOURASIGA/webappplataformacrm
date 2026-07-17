import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { Send, X } from 'lucide-react';
import { cn } from '../../lib/utils';
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
  const quickReplies = useStore(state => state.quickReplies);
  const leadInitial = lead?.name?.trim()?.charAt(0)?.toUpperCase() || '?';

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
    const plainText = text.trim();
    if (plainText && conversation && currentUser) {
      addMessage(conversation.id, currentUser.id, textToHtml(plainText));
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
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                {leadInitial}
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <div className="font-bold text-sm text-slate-800">{lead?.name || 'Lead'}</div>
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
            {quickReplies.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {quickReplies.map(qr => (
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
            )}
            <div className="flex gap-2 items-end bg-white p-2 rounded-lg border border-slate-200 shadow-sm relative">
              <div className="flex-1">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  readOnly={!conversation}
                  placeholder="Digite uma mensagem..."
                  rows={2}
                  className="w-full min-h-[40px] max-h-[120px] resize-y border-0 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400 disabled:opacity-60"
                />
              </div>
              <button 
                type="submit" 
                disabled={!text.trim() || !conversation}
                className="p-2 mb-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
