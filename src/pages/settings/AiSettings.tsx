import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function AiSettings() {
  const [enabled, setEnabled] = useState(false);
  const [model, setModel] = useState('');
  const [tone, setTone] = useState('profissional, claro e cordial');
  const [companyContext, setCompanyContext] = useState('');
  const [businessRules, setBusinessRules] = useState('');
  const [monthlyTokenLimit, setMonthlyTokenLimit] = useState(100000);
  const [currentUsage, setCurrentUsage] = useState(0);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('crm-ai-settings') || '{}');
    setEnabled(data.enabled ?? true);
    setModel(data.model || 'gpt-4o-mini');
    setTone(data.tone || 'profissional, claro e cordial');
    setCompanyContext(data.companyContext || 'Atendimento comercial da Horizonte Empreendimentos.');
    setBusinessRules(data.businessRules || 'A IA sugere conteúdo, mas o atendente revisa antes do envio.');
    setMonthlyTokenLimit(data.monthlyTokenLimit || 100000);
    setCurrentUsage(data.currentUsage || 1842);
  }, []);

  function save() {
    localStorage.setItem('crm-ai-settings', JSON.stringify({ enabled, model, tone, companyContext, businessRules, monthlyTokenLimit, currentUsage }));
    setNotice('Configurações salvas neste ambiente demonstrativo.');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-700 uppercase tracking-tight">Configurações de IA</h1>
        <p className="text-sm text-slate-500 mt-1">Configure como a IA deve apoiar o atendimento da sua equipe.</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-5">
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800">A chave é lida com segurança da variável <strong>OPENAI_API_KEY</strong> configurada na Vercel. Ela não aparece e não é armazenada no navegador.</div>
        {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
        <label className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={enabled} 
            onChange={e => setEnabled(e.target.checked)} 
            className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
          />
          <span className="font-bold text-slate-700">Ativar IA para esta conta</span>
        </label>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Modelo</label>
          <Input value={model} onChange={e => setModel(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Tom de voz</label>
          <Input value={tone} onChange={e => setTone(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Contexto da empresa</label>
          <textarea 
            className="w-full border border-slate-200 rounded-md p-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
            rows={5} 
            value={companyContext} 
            onChange={e => setCompanyContext(e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Regras comerciais</label>
          <textarea 
            className="w-full border border-slate-200 rounded-md p-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
            rows={5} 
            value={businessRules} 
            onChange={e => setBusinessRules(e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Limite mensal de tokens</label>
          <Input type="number" value={monthlyTokenLimit} onChange={e => setMonthlyTokenLimit(Number(e.target.value))} />
          <p className="text-xs font-bold text-slate-500 mt-2 bg-slate-50 p-2 rounded inline-block">Uso atual: {currentUsage} tokens</p>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <Button onClick={save}>Salvar IA</Button>
        </div>
      </div>
    </div>
  );
}
