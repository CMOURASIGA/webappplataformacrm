import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Navigate, useNavigate } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import { Users, MessageSquare, CheckCircle, Clock, Database, Bot, Send, Inbox, Target, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export default function Dashboard() {
  const currentUser = useStore(state => state.currentUser);
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser?.role === 'master') return;

    fetchApi('/dashboard/tenant')
      .then(data => setStats(data))
      .catch(err => {
        console.error('Dashboard load failed:', err);
        setError(err instanceof Error ? err.message : 'Nao foi possivel carregar os indicadores.');
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (!currentUser) return null;

  if (currentUser.role === 'master') {
    return <Navigate to="/master/dashboard" replace />;
  }

  if (loading) {
    return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const isAdmin = currentUser.role === 'admin';
  const numberValue = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const safeStats = {
    activeLeads: numberValue(stats?.activeLeads),
    wonLeads: numberValue(stats?.wonLeads),
    lostLeads: numberValue(stats?.lostLeads),
    openConversations: numberValue(stats?.openConversations),
    closedConversations: numberValue(stats?.closedConversations),
    waitingConversations: numberValue(stats?.waitingConversations),
    sentMessages: numberValue(stats?.sentMessages),
    receivedMessages: numberValue(stats?.receivedMessages),
    totalAiTokens: numberValue(stats?.totalAiTokens),
    totalAiCalls: numberValue(stats?.totalAiCalls),
    leadsByStage: Array.isArray(stats?.leadsByStage) ? stats.leadsByStage : [],
    aiUsageByAction: Array.isArray(stats?.aiUsageByAction) ? stats.aiUsageByAction : [],
  };

  const cards = [
    { name: 'Leads Ativos', value: safeStats.activeLeads, sub: `${safeStats.wonLeads} ganhos, ${safeStats.lostLeads} perdidos`, icon: Database, color: 'text-emerald-600', bg: 'bg-emerald-100', href: '/leads' },
    { name: 'Conversas Abertas', value: safeStats.openConversations, sub: `${safeStats.closedConversations} finalizadas`, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100', href: '/chat?view=abertas' },
    { name: 'Aguardando Cliente', value: safeStats.waitingConversations, sub: 'Fila de espera', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', href: '/chat?view=fila' },
    { name: 'Mensagens Enviadas', value: safeStats.sentMessages, sub: `${safeStats.receivedMessages} recebidas`, icon: Send, color: 'text-blue-600', bg: 'bg-blue-100', href: '/chat?view=todas' },
  ];

  if (isAdmin) {
    cards.push({ name: 'Consumo de IA (Tokens)', value: safeStats.totalAiTokens, sub: `${safeStats.totalAiCalls} chamadas`, icon: Bot, color: 'text-rose-600', bg: 'bg-rose-100', href: '/settings/ai' });
  }

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#64748b'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          Painel: {isAdmin ? 'gestão comercial' : 'meu desempenho'}
        </h1>
        <p className="text-sm text-slate-500">
          {isAdmin ? 'Visão completa da sua empresa.' : 'Acompanhamento de seus próprios atendimentos e leads.'}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
          <AlertTriangle size={16} /> Indicadores indisponiveis no momento. {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <button
            key={c.name}
            type="button"
            onClick={() => navigate(c.href)}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${c.bg}`}>
              <c.icon className={c.color} size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{c.name}</div>
              <div className="text-2xl font-black text-slate-800">{c.value.toLocaleString()}</div>
              <div className="text-xs text-slate-400 font-medium">{c.sub}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-700 uppercase mb-4">Leads por Etapa (Funil)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeStats.leadsByStage} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="stage_name" type="category" width={100} tick={{fontSize: 12}} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#0ea5e9" name="Quantidade" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-700 uppercase mb-4">Uso de IA por Recurso</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safeStats.aiUsageByAction}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="tokens"
                    nameKey="action"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {safeStats.aiUsageByAction.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} tokens`, 'Consumo']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
