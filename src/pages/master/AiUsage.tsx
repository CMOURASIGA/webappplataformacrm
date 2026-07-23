import React from 'react';
import { Sparkles } from 'lucide-react';
import { useStore } from '../../store';

export default function AiUsage() {
  const tenants = useStore(state => state.tenants);
  const usageData = tenants.map(tenant => ({ tenant_id: tenant.id, tenant_name: tenant.name, ai_enabled: true, ai_model: 'gpt-4o-mini', current_usage: 1842, monthly_limit: 100000, request_count: 12, last_request: new Date().toISOString() }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
          <Sparkles size={18} className="text-primary-600" />
          Consumo de IA por Cliente
        </h1>
        <p className="text-sm text-slate-500 mt-1">Visão geral do consumo de tokens OpenAI e limites mensais de cada tenant.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold text-slate-700">Cliente</th>
              <th className="px-6 py-3 font-semibold text-slate-700 text-center">Status IA</th>
              <th className="px-6 py-3 font-semibold text-slate-700">Modelo</th>
              <th className="px-6 py-3 font-semibold text-slate-700 text-right">Uso Mês / Limite</th>
              <th className="px-6 py-3 font-semibold text-slate-700 text-right">Chamadas</th>
              <th className="px-6 py-3 font-semibold text-slate-700 text-right">Último Uso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usageData.map((t: any) => {
              const pct = t.monthly_limit ? (t.current_usage / t.monthly_limit) * 100 : 0;
              return (
                <tr key={t.tenant_id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{t.tenant_name}</td>
                  <td className="px-6 py-4 text-center">
                    {t.ai_enabled ? (
                      <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-full tracking-wider">Ativa</span>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded-full tracking-wider">Inativa</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">{t.ai_model}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`font-bold ${pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {t.current_usage.toLocaleString()} / {t.monthly_limit.toLocaleString()}
                      </span>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600 font-medium">{t.request_count.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-slate-500 text-xs">
                    {t.last_request ? new Date(t.last_request).toLocaleString() : 'Nunca'}
                  </td>
                </tr>
              );
            })}
            {usageData.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Nenhum cliente cadastrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
