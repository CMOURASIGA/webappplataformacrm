import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../store';
import { Navigate, useNavigate } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import { MessageSquare, Clock, Database, Bot, Send, TrendingDown, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { PageHeader } from '../components/ui/PageHeader';
import { KpiCard } from '../components/ui/KpiCard';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { LoadingState } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

interface DashboardStats {
  activeLeads: number;
  wonLeads: number;
  lostLeads: number;
  openConversations: number;
  closedConversations: number;
  waitingConversations: number;
  sentMessages: number;
  receivedMessages: number;
  totalAiTokens: number;
  totalAiCalls: number;
  leadsByStage: Array<{ stage_name: string; count: number }>;
  aiUsageByAction: Array<{ action: string; tokens: number }>;
}

const COLORS = ['#0B3A75', '#1D9BF0', '#12B981', '#64748B', '#F59E0B'];

export default function Dashboard() {
  const currentUser = useStore(state => state.currentUser);
  const navigate = useNavigate();
  const [stats, setStats] = useState<Partial<DashboardStats> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(() => {
    if (currentUser?.role === 'master') return;
    setLoading(true);
    setError('');
    fetchApi('/dashboard/tenant')
      .then(data => setStats(data))
      .catch(err => {
        console.error('Dashboard load failed:', err);
        setError(err instanceof Error ? err.message : 'Não foi possível carregar os indicadores.');
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (!currentUser) return null;

  if (currentUser.role === 'master') {
    return <Navigate to="/master/dashboard" replace />;
  }

  const isAdmin = currentUser.role === 'admin';

  const pageHeader = (
    <PageHeader
      title={`Painel: ${isAdmin ? 'gestão comercial' : 'meu desempenho'}`}
      description={isAdmin ? 'Visão completa da sua empresa.' : 'Acompanhamento de seus próprios atendimentos e leads.'}
    />
  );

  if (loading) {
    return (
      <div className="cs-page">
        {pageHeader}
        <LoadingState label="Carregando indicadores..." rows={4} />
      </div>
    );
  }

  // Every stat below comes straight from /dashboard/tenant — no derived/estimated
  // metric (e.g. a conversion rate or an average handling time) is fabricated here
  // when the backend doesn't provide it reliably.
  const numberValue = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const s: DashboardStats = {
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
    leadsByStage: Array.isArray(stats?.leadsByStage) ? stats!.leadsByStage! : [],
    aiUsageByAction: Array.isArray(stats?.aiUsageByAction) ? stats!.aiUsageByAction! : [],
  };

  return (
    <div className="cs-page">
      {pageHeader}

      {error && (
        <ErrorState
          title="Indicadores indisponíveis no momento"
          description={error}
          onRetry={loadStats}
        />
      )}

      {/* Linha principal — indicadores comerciais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          icon={Database}
          label="Leads ativos"
          value={s.activeLeads.toLocaleString()}
          onClick={() => navigate('/leads')}
        />
        <KpiCard
          icon={TrendingUp}
          label="Ganhos"
          value={s.wonLeads.toLocaleString()}
          tone="success"
        />
        <KpiCard
          icon={TrendingDown}
          label="Perdidos"
          value={s.lostLeads.toLocaleString()}
          tone="danger"
        />
      </div>

      {/* Segunda linha — atividade de atendimento */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          icon={MessageSquare}
          label="Conversas abertas"
          value={s.openConversations.toLocaleString()}
          context={`${s.closedConversations.toLocaleString()} finalizadas`}
          onClick={() => navigate('/chat?view=abertas')}
        />
        <KpiCard
          icon={Clock}
          label="Aguardando cliente"
          value={s.waitingConversations.toLocaleString()}
          context="Fila de espera"
          tone="warning"
          onClick={() => navigate('/chat?view=fila')}
        />
        <KpiCard
          icon={Send}
          label="Mensagens enviadas"
          value={s.sentMessages.toLocaleString()}
          context={`${s.receivedMessages.toLocaleString()} recebidas`}
          onClick={() => navigate('/chat?view=todas')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leads por etapa (funil)</CardTitle>
          </CardHeader>
          {s.leadsByStage.length === 0 ? (
            <EmptyState
              title="Nenhuma etapa com leads"
              description={isAdmin ? 'Configure o funil para acompanhar a distribuição por etapa.' : 'Ainda não há leads distribuídos nas etapas do funil.'}
              action={isAdmin ? <Button size="sm" onClick={() => navigate('/settings/kanban')}>Configurar funil</Button> : undefined}
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.leadsByStage} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="stage_name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#1D9BF0" name="Quantidade" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* IA permanece um indicador secundário para Admin: anotação de consumo
            junto do próprio gráfico, sem competir com os KPIs comerciais/operacionais acima. */}
        {isAdmin && (
          <Card>
            <CardHeader className="items-start">
              <div>
                <CardTitle>Uso de IA por recurso</CardTitle>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Bot size={13} />
                  {s.totalAiTokens.toLocaleString()} tokens · {s.totalAiCalls.toLocaleString()} chamadas
                </p>
              </div>
            </CardHeader>
            {s.aiUsageByAction.length === 0 ? (
              <EmptyState title="Sem consumo de IA registrado" description="Assim que a IA for utilizada em algum recurso, o consumo aparece aqui." />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={s.aiUsageByAction}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#0B3A75"
                      dataKey="tokens"
                      nameKey="action"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {s.aiUsageByAction.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} tokens`, 'Consumo']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
