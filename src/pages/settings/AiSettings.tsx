import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function AiSettings() {
  const [enabled, setEnabled] = useState(false);
  const [model, setModel] = useState('');
  const [tone, setTone] = useState('profissional, claro e cordial');
  const [companyContext, setCompanyContext] = useState('');
  const [businessRules, setBusinessRules] = useState('');
  const [attendanceFeedbackEnabled, setAttendanceFeedbackEnabled] = useState(true);
  const [attendanceFeedbackPrompt, setAttendanceFeedbackPrompt] = useState('');
  const [automaticClosureEnabled, setAutomaticClosureEnabled] = useState(false);
  const [automaticClosureMinutes, setAutomaticClosureMinutes] = useState(1440);
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
    setAttendanceFeedbackEnabled(data.attendanceFeedbackEnabled ?? true);
    setAttendanceFeedbackPrompt(data.attendanceFeedbackPrompt || 'Avalie clareza, cordialidade, escuta ativa, entendimento da necessidade e conducao para o proximo passo. Informe pontos positivos, pontos a melhorar, desvios e recomendacoes.');
    setAutomaticClosureEnabled(data.automaticClosureEnabled ?? false);
    setAutomaticClosureMinutes(data.automaticClosureMinutes || 1440);
    setMonthlyTokenLimit(data.monthlyTokenLimit || 100000);
    setCurrentUsage(data.currentUsage || 1842);
  }, []);

  function save() {
    // Esta tela ainda não está ligada a /api/ai/settings — grava só neste navegador
    // (localStorage), não no backend. Ver DATA_PERSISTENCE_MAP.md. "Ambiente
    // demonstrativo" não é mais um texto correto fora da branch demo/localstorage, então
    // o aviso passou a descrever o que realmente acontece, em vez de rotular o ambiente.
    localStorage.setItem('crm-ai-settings', JSON.stringify({ enabled, model, tone, companyContext, businessRules, attendanceFeedbackEnabled, attendanceFeedbackPrompt, automaticClosureEnabled, automaticClosureMinutes, monthlyTokenLimit, currentUsage }));
    setNotice('Configurações salvas apenas neste navegador — ainda não sincronizam com o servidor.');
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

        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div>
            <h2 className="font-bold text-slate-800">Feedback de qualidade do atendimento</h2>
            <p className="mt-1 text-xs text-slate-500">A IA analisa toda a conversa quando o atendimento e encerrado e mantem o resultado no historico.</p>
          </div>

          <label className="flex items-center gap-3">
            <input type="checkbox" checked={attendanceFeedbackEnabled} onChange={event => setAttendanceFeedbackEnabled(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm font-bold text-slate-700">Gerar feedback ao encerrar atendimentos</span>
          </label>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">Criterios e orientacoes da analise</label>
            <textarea
              className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              rows={8}
              value={attendanceFeedbackPrompt}
              onChange={event => setAttendanceFeedbackPrompt(event.target.value)}
              placeholder="Defina o que a IA deve avaliar, quais orientacoes devem ser verificadas e se deve apresentar uma nota."
            />
            <p className="mt-1 text-xs text-slate-500">A nota somente sera exibida se estes criterios solicitarem sua apresentacao.</p>
          </div>

          <label className="flex items-center gap-3">
            <input type="checkbox" checked={automaticClosureEnabled} onChange={event => setAutomaticClosureEnabled(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm font-bold text-slate-700">Encerrar conversas automaticamente por inatividade</span>
          </label>

          {automaticClosureEnabled && (
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Tempo de inatividade em minutos</label>
              <Input type="number" min={5} max={43200} value={automaticClosureMinutes} onChange={event => setAutomaticClosureMinutes(Number(event.target.value))} />
              <p className="mt-1 text-xs text-slate-500">No encerramento automatico o feedback fica salvo para consulta, sem abrir uma janela para o atendente.</p>
            </div>
          )}
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
