import React, { useEffect, useState } from 'react';
import { Smartphone, CheckCircle, AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { fetchApi } from '../../lib/api';

export default function WhatsAppSettings() {
  const [connection, setConnection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConnection();
  }, []);

  async function loadConnection() {
    setIsLoading(true);
    try {
      const data = await fetchApi('/whatsapp/status');
      setConnection(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      await fetchApi('/whatsapp/connect', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      loadConnection();
      alert('Conectado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao conectar.');
    }
  }

  async function handleDisconnect() {
    try {
      await fetchApi('/whatsapp/disconnect', { method: 'POST' });
      setConnection(null);
      alert('Desconectado.');
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Integração WhatsApp / Meta</h1>
        <p className="text-slate-500 mt-1">Configure sua conexão oficial com a API do WhatsApp Business.</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
         <div className="flex items-center gap-4 mb-6">
           <div className={`h-12 w-12 rounded-full flex items-center justify-center ${connection ? 'bg-emerald-100' : 'bg-slate-100'}`}>
             <Smartphone className={`h-6 w-6 ${connection ? 'text-emerald-600' : 'text-slate-400'}`} />
           </div>
           <div>
             <h2 className="text-lg font-bold text-slate-800">Status da Conexão</h2>
             {isLoading ? (
               <p className="text-sm text-slate-500">Carregando...</p>
             ) : connection ? (
               <div className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                 <CheckCircle size={16} /> Conectado
               </div>
             ) : (
               <p className="text-sm text-slate-500">Nenhum número conectado no momento.</p>
             )}
           </div>
         </div>
         
         {connection && (
            <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-100">
               <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Número Conectado</span>
                    <span className="text-slate-800 font-medium">{connection.display_phone_number || '+55 00 0000-0000'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Phone Number ID</span>
                    <span className="text-slate-800 font-medium">{connection.phone_number_id}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">WABA ID</span>
                    <span className="text-slate-800 font-medium">{connection.waba_id}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Status</span>
                    <span className="text-slate-800 font-medium capitalize">{connection.connection_status}</span>
                  </div>
               </div>
            </div>
         )}
         
         <div className="space-y-4">
            {!connection ? (
              <form onSubmit={handleConnect} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number ID</label>
                  <input name="phone_number_id" required className="w-full border border-slate-300 rounded-lg p-2" placeholder="Ex: 104561234567890" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Business Account ID (WABA ID)</label>
                  <input name="waba_id" required className="w-full border border-slate-300 rounded-lg p-2" placeholder="Ex: 101234567890123" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Permanent Access Token</label>
                  <input name="access_token" required type="password" className="w-full border border-slate-300 rounded-lg p-2" placeholder="EAA..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Número de Exibição (Opcional)</label>
                  <input name="display_phone_number" className="w-full border border-slate-300 rounded-lg p-2" placeholder="+55 11 99999-9999" />
                </div>
                <Button type="submit" className="w-full sm:w-auto">Conectar com WhatsApp</Button>
                <p className="text-xs text-slate-400 mt-2">Para este MVP, insira as credenciais do seu app Meta for Developers.</p>
              </form>
            ) : (
              <div className="flex gap-2">
                 <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDisconnect}>Desconectar</Button>
                 <Button variant="outline" onClick={loadConnection}><RefreshCcw size={16} className="mr-2"/> Atualizar Status</Button>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
