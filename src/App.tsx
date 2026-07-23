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
import KnowledgeBase from './pages/settings/KnowledgeBase';
import AiSettings from './pages/settings/AiSettings';
import WhatsAppSettings from './pages/settings/WhatsAppSettings';
import InternalChat from './pages/chat/InternalChat';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="crm" element={<Kanban />} />
          <Route path="settings/kanban" element={<KanbanConfig />} />
          <Route path="leads" element={<LeadsList />} />
          <Route path="chat" element={<ErrorBoundary title="Não foi possível exibir as conversas"><Chat /></ErrorBoundary>} />
          <Route path="chat/quick-replies" element={<QuickReplies />} />
          <Route path="internal-chat" element={<ErrorBoundary title="Nao foi possivel exibir o chat interno"><InternalChat /></ErrorBoundary>} />
          <Route path="settings" element={<Settings />} />
          <Route path="users" element={<Users />} />
          <Route path="knowledge" element={<KnowledgeBase />} />
          <Route path="settings/ai" element={<AiSettings />} />
          <Route path="settings/whatsapp" element={<WhatsAppSettings />} />
          <Route path="master/dashboard" element={<MasterDashboard />} />
          <Route path="master/tenants" element={<Tenants />} />
          <Route path="master/ai-usage" element={<AiUsage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
