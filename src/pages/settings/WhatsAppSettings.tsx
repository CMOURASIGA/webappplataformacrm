import React from 'react';
import { Smartphone, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function WhatsAppSettings() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Integração WhatsApp / Meta</h1>
        <p className="text-slate-500 mt-1">Configure sua conexão oficial com a API do WhatsApp Business.</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
         <div className="flex items-center gap-4 mb-6">
           <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
             <Smartphone className="h-6 w-6 text-emerald-600" />
           </div>
           <div>
             <h2 className="text-lg font-bold text-slate-800">Status da Conexão</h2>
             <p className="text-sm text-slate-500">Nenhum número conectado no momento.</p>
           </div>
         </div>
         
         <div className="space-y-4">
            <Button className="w-full sm:w-auto">Conectar com Facebook / Meta</Button>
            <p className="text-xs text-slate-400">Você será redirecionado para o fluxo Embedded Signup da Meta.</p>
         </div>
      </div>
    </div>
  );
}
