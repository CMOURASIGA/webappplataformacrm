import React, { useState } from 'react';
import { useStore } from '../../store';
import { Copy, Pencil, Plus, Trash2, MessageSquare, Smile } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

export default function QuickReplies() {
  const quickReplies = useStore(state => state.quickReplies) || [];
  const createQuickReply = useStore(state => state.createQuickReply);
  const updateQuickReply = useStore(state => state.updateQuickReply);
  const deleteQuickReply = useStore(state => state.deleteQuickReply);
  
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Geral');
  const [showEmoji, setShowEmoji] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && text.trim()) {
      if (editingId) await updateQuickReply(editingId, { title, text, category });
      else await createQuickReply(title, text, category);
      setTitle('');
      setText('');
      setCategory('Geral');
      setIsAdding(false);
      setShowEmoji(false);
      setEditingId(null);
      setFeedback(editingId ? 'Resposta rápida atualizada.' : 'Resposta rápida criada.');
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Respostas Rápidas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Crie modelos que o atendente insere e pode editar antes do envio.
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus size={16} /> Nova resposta
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">{editingId ? 'Editar resposta' : 'Adicionar nova resposta'}</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex.: Comercial" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Título</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Ex: Saudação Inicial"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Mensagem</label>
              <p className="text-xs text-slate-500 mb-2">Use formatação do WhatsApp: *negrito*, _itálico_, ~tachado~.</p>
              <div className="relative">
                <div className="border border-slate-300 rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
                  <textarea 
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                    className="w-full min-h-[150px] p-3 outline-none resize-y"
                    placeholder="Sua mensagem..."
                    required
                  />
                  
                  <div className="absolute top-2 right-2 z-10">
                    <button 
                      type="button"
                      onClick={() => setShowEmoji(!showEmoji)}
                      className="text-slate-400 hover:text-primary-600 transition-colors bg-white p-1 rounded-md border border-slate-200 shadow-sm"
                    >
                      <Smile size={18} />
                    </button>
                    
                    {showEmoji && (
                      <div className="absolute right-0 top-10 z-50">
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => { setIsAdding(false); setEditingId(null); }}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar
              </Button>
            </div>
          </form>
        </div>
      )}
      {feedback && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{feedback}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickReplies.map((reply) => (
          <div key={reply.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare size={16} className="text-primary-500" />
                {reply.title}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingId(reply.id); setTitle(reply.title); setText(reply.text); setCategory(reply.category || 'Geral'); setIsAdding(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-slate-400 hover:text-primary-600" title="Editar"><Pencil size={16} /></button>
                <button onClick={() => { navigator.clipboard.writeText(reply.text); setFeedback('Conteúdo copiado.'); }} className="text-slate-400 hover:text-primary-600" title="Copiar conteúdo"><Copy size={16} /></button>
                <button onClick={() => { if (window.confirm('Deseja realmente excluir esta resposta rápida? Esta ação não poderá ser desfeita.')) { deleteQuickReply(reply.id); setFeedback('Resposta rápida excluída.'); } }} className="text-slate-400 hover:text-red-500 transition-colors" title="Excluir"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="px-4 pt-3 text-[10px] font-bold uppercase tracking-wider text-primary-600">{reply.category || 'Geral'}</div>
            <div className="p-4 flex-1 text-sm text-slate-600 overflow-y-auto max-h-[200px] whitespace-pre-wrap">
              {reply.text}
            </div>
          </div>
        ))}

        {quickReplies.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
            Nenhuma resposta rápida cadastrada ainda.
          </div>
        )}
      </div>
    </div>
  );
}
