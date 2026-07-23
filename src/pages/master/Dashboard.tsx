import React from 'react';
import { AlertTriangle, BarChart, Bot, Building2, Database, MessageSquare, Users, Zap } from 'lucide-react';
import { useStore } from '../../store';

export default function MasterDashboard() {
  const tenants = useStore(state => state.tenants);
  const users = useStore(state => state.users);
  const leads = useStore(state => state.leads);
  const conversations = useStore(state => state.conversations);
  const messages = useStore(state => state.messages);
  const error = '';
  const stats = {
    totalTenants: tenants.length, activeTenants: tenants.filter(t => t.status === 'active').length,
    totalUsers: users.length, totalLeads: leads.length, totalConversations: conversations.length,
    totalMessages: messages.length, sentMessages: messages.filter(m => m.senderId !== 'lead').length,
    receivedMessages: messages.filter(m => m.senderId === 'lead').length, totalAiCalls: 12, totalAiTokens: 1842,
    clientsUsage: tenants.map(t => ({ name: t.name, leads_count: leads.filter(l => l.tenantId === t.id).length, conv_count: conversations.filter(c => c.tenantId === t.id).length, ai_tokens: 1842 })),
  };

  const numberValue = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const safeStats = {
    totalTenants: numberValue(stats?.totalTenants),
    activeTenants: numberValue(stats?.activeTenants),
    totalUsers: numberValue(stats?.totalUsers),
    totalLeads: numberValue(stats?.totalLeads),
    totalConversations: numberValue(stats?.totalConversations),
    totalMessages: numberValue(stats?.totalMessages),
    sentMessages: numberValue(stats?.sentMessages),
    receivedMessages: numberValue(stats?.receivedMessages),
    totalAiCalls: numberValue(stats?.totalAiCalls),
    totalAiTokens: numberValue(stats?.totalAiTokens),
    clientsUsage: Array.isArray(stats?.clientsUsage) ? stats.clientsUsage : [],
  };

  const cards = [
    { name: 'Total de Clientes', value: safeStats.totalTenants, sub: `${safeStats.activeTenants} ativos`, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Total de Usuarios', value: safeStats.totalUsers, sub: 'Na plataforma', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Leads Gerados', value: safeStats.totalLeads, sub: 'Todos os clientes', icon: Database, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Conversas', value: safeStats.totalConversations, sub: 'Total aberto', icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Mensagens Trocadas', value: safeStats.totalMessages, sub: `${safeStats.sentMessages} env / ${safeStats.receivedMessages} rec`, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100' },
    { name: 'Chamadas de IA', value: safeStats.totalAiCalls, sub: `${safeStats.totalAiTokens} tokens`, icon: Bot, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart className="text-primary-600" />
          Painel master
        </h1>
        <p className="text-sm text-slate-500">Visao executiva de toda a plataforma SaaS</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
          <AlertTriangle size={16} /> Indicadores indisponiveis no momento. {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <div key={card.name} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.bg}`}>
              <card.icon className={card.color} size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.name}</div>
              <div className="text-2xl font-black text-slate-800">{card.value.toLocaleString()}</div>
              <div className="text-xs text-slate-400 font-medium">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-700">Top Clientes por Volume</h2>
        </div>
        <div className="overflow-x-auto">
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
              {safeStats.clientsUsage.map((client: any, index: number) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{client.name}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{numberValue(client.leads_count).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{numberValue(client.conv_count).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{numberValue(client.ai_tokens).toLocaleString()}</td>
                </tr>
              ))}
              {safeStats.clientsUsage.length === 0 && (
                <tr><td colSpan={4} className="text-center py-6 text-slate-400">Nenhum dado encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
