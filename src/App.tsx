/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MasterDashboard from './pages/master/Dashboard';
import Tenants from './pages/master/Tenants';
import AiUsage from './pages/master/AiUsage';
import Kanban from './pages/crm/Kanban';
import KanbanConfig from './pages/crm/KanbanConfig';
import LeadsList from './pages/crm/LeadsList';
import Chat from './pages/chat/Chat';
import QuickReplies from './pages/chat/QuickReplies';
import Settings from './pages/admin/Settings';
import Users from './pages/admin/Users';
import AiSettings from './pages/settings/AiSettings';
import WhatsAppSettings from './pages/settings/WhatsAppSettings';
import Automations from './pages/settings/Automations';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useStore } from './store';

function RequireRole({ roles, children }: { roles: Array<'master' | 'admin' | 'user'>; children: React.ReactNode }) {
  const role = useStore(state => state.currentUser?.role);
  return role && roles.includes(role) ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="crm" element={<Kanban />} />
          <Route path="settings/kanban" element={<RequireRole roles={['master', 'admin']}><KanbanConfig /></RequireRole>} />
          <Route path="leads" element={<LeadsList />} />
          <Route path="chat" element={<ErrorBoundary title="Não foi possível exibir as conversas"><Chat /></ErrorBoundary>} />
          <Route path="chat/quick-replies" element={<RequireRole roles={['master', 'admin']}><QuickReplies /></RequireRole>} />
          <Route path="settings" element={<RequireRole roles={['master', 'admin']}><Settings /></RequireRole>} />
          <Route path="users" element={<RequireRole roles={['master', 'admin']}><Users /></RequireRole>} />
          <Route path="settings/automations" element={<RequireRole roles={['master', 'admin']}><Automations /></RequireRole>} />
          <Route path="settings/ai" element={<RequireRole roles={['master', 'admin']}><AiSettings /></RequireRole>} />
          <Route path="settings/whatsapp" element={<RequireRole roles={['master', 'admin']}><WhatsAppSettings /></RequireRole>} />
          <Route path="master/dashboard" element={<RequireRole roles={['master']}><MasterDashboard /></RequireRole>} />
          <Route path="master/tenants" element={<RequireRole roles={['master']}><Tenants /></RequireRole>} />
          <Route path="master/ai-usage" element={<RequireRole roles={['master']}><AiUsage /></RequireRole>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
