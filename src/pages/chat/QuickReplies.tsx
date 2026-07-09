import React, { useState } from 'react';
import { useStore } from '../../store';
import { Plus, Trash2, Edit2, MessageSquare, Smile } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import DOMPurify from 'dompurify';

export default function QuickReplies() {
  const quickReplies = useStore(state => state.quickReplies);
  const createQuickReply = useStore(state => state.createQuickReply);
  const deleteQuickReply = useStore(state => state.deleteQuickReply);
  
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && text.trim()) {
      await createQuickReply(title, text);
      setTitle('');
      setText('');
      setIsAdding(false);
      setShowEmoji(false);
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
            Crie modelos de mensagens para usar rapidamente no chat.
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus size={16} /> Nova Resposta
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Adicionar Nova Resposta</h2>
          <form onSubmit={handleCreate} className="space-y-4">
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
              <div className="relative">
                <div className="border border-slate-300 rounded-md overflow-hidden bg-white">
                  <ReactQuill 
                    theme="snow"
                    value={text} 
                    onChange={setText} 
                    modules={modules}
                    className="min-h-[150px]"
                  />
                  <div className="absolute top-2 right-2 z-10">
                    <button 
                      type="button"
                      onClick={() => setShowEmoji(!showEmoji)}
                      className="text-slate-400 hover:text-primary-600 transition-colors bg-white p-1 rounded-md border border-slate-200"
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickReplies.map((reply) => (
          <div key={reply.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare size={16} className="text-primary-500" />
                {reply.title}
              </div>
              <button 
                onClick={() => deleteQuickReply(reply.id)}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Excluir"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div 
              className="p-4 flex-1 text-sm text-slate-600 overflow-y-auto max-h-[200px] prose prose-sm prose-slate"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.text) }}
            />
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
