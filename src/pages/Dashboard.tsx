import React from 'react';
import { useStore } from '../store';
import { Users, MessageSquare, CheckCircle, Clock } from 'lucide-react';

export default function Dashboard() {
  const currentUser = useStore(state => state.currentUser);
  const leads = useStore(state => state.leads).filter(l => l.tenantId === currentUser?.tenantId);
  const conversations = useStore(state => state.conversations).filter(c => c.tenantId === currentUser?.tenantId);

  const stats = [
    { name: 'Total Leads', value: leads.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Open Chats', value: conversations.filter(c => ['new', 'in_progress'].includes(c.status)).length, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Won Leads', value: leads.filter(l => l.status === 'won').length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Waiting Reply', value: conversations.filter(c => c.status === 'waiting_client').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-slate-700 uppercase tracking-tight">Overview</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">{stat.name}</dt>
                    <dd className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
