import React, { useEffect, useState } from 'react';
import { Book, Plus, Upload, Trash2, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { fetchApi } from '../../lib/api';

export default function KnowledgeBase() {
  const [bases, setBases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBases();
  }, []);

  async function loadBases() {
    setLoading(true);
    try {
      const data = await fetchApi('/knowledge-bases');
      setBases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBase() {
    const name = prompt('Nome da base de conhecimento:');
    if (!name) return;
    try {
      await fetchApi('/knowledge-bases', {
        method: 'POST',
        body: JSON.stringify({ name, description: '' })
      });
      loadBases();
    } catch (err) {
      alert('Erro ao criar base');
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Book className="text-primary-600" />
            Base de Conhecimento (IA)
          </h1>
          <p className="text-slate-500 mt-1">Gerencie os documentos que a IA usará para responder seus clientes.</p>
        </div>
        <Button onClick={handleCreateBase}><Plus size={16} className="mr-2" /> Nova Base</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-400">Carregando...</div>
        ) : bases.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
            Nenhuma base de conhecimento criada.
          </div>
        ) : bases.map(b => (
          <div key={b.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <h3 className="font-bold text-lg text-slate-800 mb-2">{b.name}</h3>
            <p className="text-slate-500 text-sm flex-1">{b.description || 'Sem descrição'}</p>
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Ativa</span>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={() => alert('Em breve: Gerenciar Documentos')}><Upload size={14} className="mr-2"/> Docs</Button>
                 <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 size={14} /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
