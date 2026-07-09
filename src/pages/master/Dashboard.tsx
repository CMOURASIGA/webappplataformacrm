import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api';
import { Building2, Users, MessageSquare, Database, Bot, Zap, ArrowRight, BarChart } from 'lucide-react';
import { useStore } from '../../store';

export default function MasterDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/dashboard/master')
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) {
    return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const cards = [
    { name: 'Total de Clientes', value: stats.totalTenants, sub: `\${stats.activeTenants} ativos`, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Total de Usuários', value: stats.totalUsers, sub: 'Na plataforma', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Leads Gerados', value: stats.totalLeads, sub: 'Todos os clientes', icon: Database, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Conversas', value: stats.totalConversations, sub: 'Total aberto', icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Mensagens Trocadas', value: stats.totalMessages, sub: `\${stats.sentMessages} env / \${stats.receivedMessages} rec`, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100' },
    { name: 'Chamadas de IA', value: stats.totalAiCalls, sub: `\${stats.totalAiTokens} tokens`, icon: Bot, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart className="text-primary-600" />
          Dashboard Master
        </h1>
        <p className="text-sm text-slate-500">Visão executiva de toda a plataforma SaaS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.name} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center \${c.bg}`}>
              <c.icon className={c.color} size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{c.name}</div>
              <div className="text-2xl font-black text-slate-800">{c.value.toLocaleString()}</div>
              <div className="text-xs text-slate-400 font-medium">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-700">Top Clientes por Volume</h2>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 font-semibold">Cliente</th>
              <th className="px-6 py-3 font-semibold text-right">Leads</th>
              <th className="px-6 py-3 font-semibold text-right">Conversas</th>
              <th className="px-6 py-3 font-semibold text-right">Tokens IA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stats.clientsUsage?.map((c: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">{c.name}</td>
                <td className="px-6 py-4 text-right text-slate-600">{c.leads_count.toLocaleString()}</td>
                <td className="px-6 py-4 text-right text-slate-600">{c.conv_count.toLocaleString()}</td>
                <td className="px-6 py-4 text-right text-slate-600">{c.ai_tokens.toLocaleString()}</td>
              </tr>
            ))}
            {(!stats.clientsUsage || stats.clientsUsage.length === 0) && (
              <tr><td colSpan={4} className="text-center py-6 text-slate-400">Nenhum dado encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
