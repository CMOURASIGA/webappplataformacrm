import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuditLog, AutomationRule, Conversation, InternalChannel, InternalMessage, Lead, Message, Pipeline, QuickReply, Tenant, TenantTag, User } from './types';
import { generateId } from './lib/utils';
import { fetchApi } from './lib/api';

interface AppState {
  currentUser: User | null;
  users: User[];
  tenants: Tenant[];
  pipelines: Pipeline[];
  leads: Lead[];
  conversations: Conversation[];
  messages: Message[];
  quickReplies: QuickReply[];
  tags: TenantTag[];
  automations: AutomationRule[];
  internalChannels: InternalChannel[];
  internalMessages: InternalMessage[];
  auditLogs: AuditLog[];
  isInitialized: boolean;
  initError: string | null;
  activeTenantId: string | null;
  loginError: string | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  initializeData: () => Promise<void>;
  setActiveTenantId: (id: string | null) => Promise<void>;
  addTenant: (data: any) => Promise<void>;
  updateTenantSettings: (tenantId: string, settings: any) => Promise<void>;
  updateTenant: (tenantId: string, updates: Partial<Tenant>) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  createTag: (name: string, color: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  createStage: (pipelineId: string, name: string, order: number) => Promise<void>;
  deleteStage: (id: string) => Promise<void>;
  reorderStages: (pipelineId: string, stageIds: string[]) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  setLeadClassification: (id: string, classification: Lead['classification'], details?: Lead['classificationDetails'], classifiedAt?: string) => void;
  moveLead: (leadId: string, newStageId: string) => Promise<void>;
  addLeadHistory: (leadId: string, entry: Omit<NonNullable<Lead['history']>[number], 'id' | 'createdAt'>) => void;
  addLeadAttachment: (leadId: string, file: File) => void;
  removeLeadAttachment: (leadId: string, attachmentId: string) => void;
  addConversation: (leadId: string, tenantId: string) => Promise<void>;
  addMessage: (conversationId: string, senderId: string, text: string) => Promise<void>;
  assignConversation: (conversationId: string, userId: string) => Promise<void>;
  updateConversationStatus: (conversationId: string, status: Conversation['status'], closeReason?: string) => Promise<Conversation | undefined>;
  fetchMessages: (conversationId: string) => Promise<void>;
  createQuickReply: (title: string, text: string, category: string) => Promise<void>;
  updateQuickReply: (id: string, updates: Partial<QuickReply>) => Promise<void>;
  deleteQuickReply: (id: string) => Promise<void>;
  createInternalChannel: (channel: Omit<InternalChannel, 'id' | 'createdAt'>) => Promise<void>;
  addInternalMessage: (channelId: string, text: string) => Promise<void>;
  logAction: (module: string, action: string, status: AuditLog['status'], message: string) => void;
  saveAutomation: (rule: AutomationRule) => void;
  deleteAutomation: (id: string) => void;
}

const defaultAutomations: AutomationRule[] = [
  { id: 'auto-summary', tenantId: 'tenant-1', name: 'Registrar resumo no histórico', description: 'Cada resumo de IA é gravado automaticamente no histórico do lead.', enabled: true, trigger: 'ai_summary', action: 'save_history' },
  { id: 'auto-idle', tenantId: 'tenant-1', name: 'Sinalizar lead sem ação', description: 'Adiciona uma sinalização visual quando o lead permanece sem movimentação.', enabled: true, trigger: 'stage_idle', delayHours: 24, action: 'attention_tag' },
  { id: 'auto-classify', tenantId: 'tenant-1', name: 'Classificar novos leads', description: 'Sugere prioridade após o primeiro atendimento.', enabled: false, trigger: 'new_lead', action: 'attention_tag' },
];

const mapLead = (lead: any): Lead => ({
  ...lead,
  tenantId: lead.tenantId ?? lead.tenant_id,
  stageId: lead.stageId ?? lead.stage_id,
  pipelineId: lead.pipelineId ?? lead.pipeline_id,
  assignedTo: lead.assignedTo ?? lead.assigned_to,
  createdAt: lead.createdAt ?? lead.created_at,
  updatedAt: lead.updatedAt ?? lead.updated_at,
});

const mapConversation = (conversation: any): Conversation => ({
  ...conversation,
  tenantId: conversation.tenantId ?? conversation.tenant_id,
  leadId: conversation.leadId ?? conversation.lead_id,
  assignedTo: conversation.assignedTo ?? conversation.assigned_to,
  createdAt: conversation.createdAt ?? conversation.created_at,
  updatedAt: conversation.updatedAt ?? conversation.updated_at,
});

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      tenants: [],
      pipelines: [],
      leads: [],
      conversations: [],
      messages: [],
      quickReplies: [],
      tags: [],
      automations: defaultAutomations,
      internalChannels: [],
      internalMessages: [],
      auditLogs: [],
      isInitialized: false,
      initError: null,
      loginError: null,
      activeTenantId: localStorage.getItem('activeTenantId'),

      login: async (email, password = '') => {
        try {
          set({ loginError: null, initError: null });
          const response = await fetchApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
          });
          localStorage.setItem('token', response.token);
          set({ currentUser: response.user, isInitialized: false, loginError: null });
          await get().initializeData();
        } catch (error: any) {
          const message = error?.message || 'Não foi possível autenticar.';
          localStorage.removeItem('token');
          set({ currentUser: null, isInitialized: false, loginError: message });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('activeTenantId');
        set({
          currentUser: null,
          users: [],
          tenants: [],
          pipelines: [],
          leads: [],
          conversations: [],
          messages: [],
          quickReplies: [],
          tags: [],
          activeTenantId: null,
          isInitialized: false,
          initError: null,
          loginError: null,
        });
      },

      initializeData: async () => {
        const { currentUser, activeTenantId } = get();
        if (!currentUser) return;

        const safeFetch = async <T,>(loader: () => Promise<T>, fallback: T): Promise<T> => {
          try {
            return await loader();
          } catch (error) {
            console.error('Initial data load failed:', error);
            return fallback;
          }
        };

        try {
          if (currentUser.role === 'master') {
            const tenants = await fetchApi('/admin/tenants');
            if (!activeTenantId) {
              set({ tenants, isInitialized: true, initError: null });
              return;
            }

            const [settings, pipelines, leads, conversations, tags, quickReplies] = await Promise.all([
              safeFetch(() => fetchApi('/tenant/settings'), null as any),
              safeFetch(() => fetchApi('/pipelines'), []),
              safeFetch(() => fetchApi('/leads'), []),
              safeFetch(() => fetchApi('/conversations'), []),
              safeFetch(() => fetchApi('/tags'), []),
              safeFetch(() => fetchApi('/quick-replies'), []),
            ]);

            const nextTenants = settings ? tenants.map((tenant: Tenant) => tenant.id === activeTenantId ? {
              ...tenant,
              settings: {
                companyName: settings.company_name,
                primaryColor: settings.primary_color,
                logoUrl: settings.logo_url,
                sidebarColor: settings.sidebar_color,
                sidebarTextColor: settings.sidebar_text_color,
              },
            } : tenant) : tenants;

            set({
              tenants: nextTenants,
              pipelines,
              leads: leads.map(mapLead),
              conversations: conversations.map(mapConversation),
              tags,
              quickReplies,
              isInitialized: true,
              initError: null,
            });
            return;
          }

          const [settings, pipelines, leads, conversations, tags, quickReplies] = await Promise.all([
            fetchApi('/tenant/settings'),
            safeFetch(() => fetchApi('/pipelines'), []),
            safeFetch(() => fetchApi('/leads'), []),
            safeFetch(() => fetchApi('/conversations'), []),
            safeFetch(() => fetchApi('/tags'), []),
            safeFetch(() => fetchApi('/quick-replies'), []),
          ]);

          const tenant: Tenant = {
            id: currentUser.tenantId as string,
            name: settings.company_name,
            status: 'active',
            createdAt: new Date().toISOString(),
            settings: {
              companyName: settings.company_name,
              primaryColor: settings.primary_color,
              logoUrl: settings.logo_url,
              sidebarColor: settings.sidebar_color,
              sidebarTextColor: settings.sidebar_text_color,
            },
          };

          set({
            tenants: [tenant],
            pipelines,
            leads: leads.map(mapLead),
            conversations: conversations.map(mapConversation),
            tags,
            quickReplies,
            isInitialized: true,
            initError: null,
          });
        } catch (error: any) {
          console.error('Failed to initialize data:', error);
          if (String(error?.message || '').toLowerCase().includes('unauthorized')) {
            localStorage.removeItem('token');
            set({ currentUser: null, isInitialized: false, initError: null });
            return;
          }
          set({ initError: error?.message || 'Falha ao carregar dados.', isInitialized: false });
          throw error;
        }
      },

      setActiveTenantId: async id => {
        if (id) localStorage.setItem('activeTenantId', id);
        else localStorage.removeItem('activeTenantId');
        set({ activeTenantId: id, isInitialized: false, initError: null });
        await get().initializeData();
      },

      addTenant: async data => {
        await fetchApi('/admin/tenants', { method: 'POST', body: JSON.stringify(data) });
        const tenants = await fetchApi('/admin/tenants');
        set({ tenants });
      },

      updateTenantSettings: async (tenantId, settings) => {
        const persisted = await fetchApi('/tenant/settings', {
          method: 'PATCH',
          body: JSON.stringify({
            company_name: settings.companyName,
            primary_color: settings.primaryColor,
            logo_url: settings.logoUrl,
            sidebar_color: settings.sidebarColor,
            sidebar_text_color: settings.sidebarTextColor,
          }),
        });
        set(state => ({
          tenants: state.tenants.map(tenant => tenant.id === tenantId ? {
            ...tenant,
            name: persisted.company_name || tenant.name,
            settings: {
              ...(tenant.settings || {}),
              companyName: persisted.company_name,
              primaryColor: persisted.primary_color,
              logoUrl: persisted.logo_url,
              sidebarColor: persisted.sidebar_color,
              sidebarTextColor: persisted.sidebar_text_color,
            },
          } : tenant),
        }));
      },

      updateTenant: async (tenantId, updates) => {
        set(state => ({ tenants: state.tenants.map(t => t.id === tenantId ? { ...t, ...updates } : t) }));
      },

      addUser: user => set(state => ({ users: [...state.users, { ...user, id: generateId() }] })),
      updateUser: (id, updates) => set(state => ({ users: state.users.map(user => user.id === id ? { ...user, ...updates } : user) })),

      createTag: async (name, color) => {
        const tag = await fetchApi('/tags', { method: 'POST', body: JSON.stringify({ name, color }) });
        set(state => ({ tags: [tag, ...state.tags] }));
      },
      deleteTag: async id => {
        await fetchApi(`/tags/${id}`, { method: 'DELETE' });
        set(state => ({ tags: state.tags.filter(tag => tag.id !== id) }));
      },
      createStage: async (pipelineId, name, order) => {
        await fetchApi(`/pipelines/${pipelineId}/stages`, { method: 'POST', body: JSON.stringify({ name, order }) });
        const pipelines = await fetchApi('/pipelines');
        set({ pipelines });
      },
      deleteStage: async id => {
        await fetchApi(`/stages/${id}`, { method: 'DELETE' });
        const pipelines = await fetchApi('/pipelines');
        set({ pipelines });
      },
      reorderStages: async (pipelineId, stageIds) => {
        await fetchApi(`/pipelines/${pipelineId}/stages/reorder`, { method: 'PATCH', body: JSON.stringify({ stage_ids: stageIds }) });
        set(state => ({ pipelines: state.pipelines.map(p => p.id === pipelineId ? { ...p, stages: stageIds.map((id, order) => ({ ...p.stages.find(stage => stage.id === id)!, order })) } : p) }));
      },

      addLead: async lead => {
        const saved = await fetchApi('/leads', {
          method: 'POST',
          body: JSON.stringify({
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            company: lead.company,
            source: lead.source,
            source_type: lead.sourceType || 'manual',
            stage_id: lead.stageId,
            pipeline_id: lead.pipelineId,
            tags: lead.tags || [],
            classification: lead.classification,
          }),
        });
        const formatted = mapLead(saved);
        set(state => ({ leads: [formatted, ...state.leads] }));
        await get().addConversation(formatted.id, formatted.tenantId);
      },
      updateLead: async (id, updates) => {
        const saved = await fetchApi(`/leads/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: updates.name,
            phone: updates.phone,
            email: updates.email,
            company: updates.company,
            source: updates.source,
            source_type: updates.sourceType,
            stage_id: updates.stageId,
            tags: updates.tags,
            notes: updates.notes,
            classification: updates.classification,
          }),
        });
        set(state => ({ leads: state.leads.map(lead => lead.id === id ? { ...lead, ...mapLead(saved) } : lead) }));
      },
      setLeadClassification: (id, classification, details, classifiedAt) => set(state => ({ leads: state.leads.map(lead => lead.id === id ? { ...lead, classification, classificationDetails: details, classifiedAt: classifiedAt || new Date().toISOString() } : lead) })),
      moveLead: async (leadId, newStageId) => {
        await fetchApi(`/leads/${leadId}`, { method: 'PATCH', body: JSON.stringify({ stage_id: newStageId }) });
        set(state => ({ leads: state.leads.map(lead => lead.id === leadId ? { ...lead, stageId: newStageId, updatedAt: new Date().toISOString() } : lead) }));
      },
      addLeadHistory: (leadId, entry) => set(state => ({ leads: state.leads.map(lead => lead.id === leadId ? { ...lead, history: [{ ...entry, id: generateId(), createdAt: new Date().toISOString() }, ...(lead.history || [])] } : lead) })),
      addLeadAttachment: (leadId, file) => set(state => ({ leads: state.leads.map(lead => lead.id === leadId ? { ...lead, attachments: [...(lead.attachments || []), { id: generateId(), name: file.name, type: file.type || 'application/octet-stream', size: file.size, createdAt: new Date().toISOString() }] } : lead) })),
      removeLeadAttachment: (leadId, attachmentId) => set(state => ({ leads: state.leads.map(lead => lead.id === leadId ? { ...lead, attachments: lead.attachments?.filter(item => item.id !== attachmentId) } : lead) })),

      addConversation: async leadId => {
        const saved = await fetchApi('/conversations', { method: 'POST', body: JSON.stringify({ lead_id: leadId }) });
        const formatted = mapConversation(saved);
        set(state => state.conversations.some(item => item.id === formatted.id) ? state : ({ conversations: [formatted, ...state.conversations] }));
      },
      fetchMessages: async conversationId => {
        const raw = await fetchApi(`/conversations/${conversationId}/messages`);
        const messages = raw.map((message: any) => ({ ...message, conversationId: message.conversation_id, senderId: message.sender_id, createdAt: message.created_at }));
        set(state => ({ messages: [...state.messages.filter(message => message.conversationId !== conversationId), ...messages] }));
      },
      addMessage: async (conversationId, _senderId, text) => {
        const raw = await fetchApi(`/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ text }) });
        const message = { ...raw, conversationId: raw.conversation_id, senderId: raw.sender_id, createdAt: raw.created_at };
        set(state => ({ messages: [...state.messages, message] }));
      },
      assignConversation: async (conversationId, userId) => {
        const saved = await fetchApi(`/conversations/${conversationId}/assign`, { method: 'PATCH', body: JSON.stringify({ assigned_to: userId }) });
        set(state => ({ conversations: state.conversations.map(item => item.id === conversationId ? { ...item, ...mapConversation(saved) } : item) }));
      },
      updateConversationStatus: async (conversationId, status, closeReason) => {
        const saved = await fetchApi(`/conversations/${conversationId}/status`, { method: 'PATCH', body: JSON.stringify({ status, close_reason: closeReason }) });
        const formatted = mapConversation(saved);
        set(state => ({ conversations: state.conversations.map(item => item.id === conversationId ? { ...item, ...formatted } : item) }));
        return formatted;
      },

      createQuickReply: async (title, text, category) => {
        const reply = await fetchApi('/quick-replies', { method: 'POST', body: JSON.stringify({ title, text, category }) });
        set(state => ({ quickReplies: [reply, ...state.quickReplies] }));
      },
      updateQuickReply: async (id, updates) => {
        set(state => ({ quickReplies: state.quickReplies.map(reply => reply.id === id ? { ...reply, ...updates } : reply) }));
      },
      deleteQuickReply: async id => {
        await fetchApi(`/quick-replies/${id}`, { method: 'DELETE' });
        set(state => ({ quickReplies: state.quickReplies.filter(reply => reply.id !== id) }));
      },

      createInternalChannel: async channel => {
        const item = { ...channel, id: generateId(), createdAt: new Date().toISOString() };
        set(state => ({ internalChannels: [item, ...state.internalChannels] }));
      },
      addInternalMessage: async (channelId, text) => {
        const senderId = get().currentUser?.id;
        if (!senderId) throw new Error('Usuário não identificado.');
        set(state => ({ internalMessages: [...state.internalMessages, { id: generateId(), channelId, senderId, text, createdAt: new Date().toISOString() }] }));
      },
      logAction: (module, action, status, message) => set(state => ({ auditLogs: [{ id: generateId(), module, action, status, message, userId: get().currentUser?.id, createdAt: new Date().toISOString() }, ...state.auditLogs].slice(0, 200) })),
      saveAutomation: rule => set(state => ({ automations: state.automations.some(item => item.id === rule.id) ? state.automations.map(item => item.id === rule.id ? rule : item) : [rule, ...state.automations] })),
      deleteAutomation: id => set(state => ({ automations: state.automations.filter(rule => rule.id !== id) })),
    }),
    {
      name: 'crm-storage',
      partialize: state => ({ currentUser: state.currentUser }),
    },
  ),
);
