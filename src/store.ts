import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AutomationRule, Conversation, Lead, Message, Pipeline, QuickReply, Tenant, TenantTag, User } from './types';
import { generateId } from './lib/utils';
import { createDemoSnapshot, demoUsers } from './demoData';

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
  updateConversationStatus: (conversationId: string, status: Conversation['status'], closeReason?: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  createQuickReply: (title: string, text: string, category: string) => Promise<void>;
  deleteQuickReply: (id: string) => Promise<void>;
  saveAutomation: (rule: AutomationRule) => void;
  deleteAutomation: (id: string) => void;
}

const defaultAutomations: AutomationRule[] = [
  { id: 'auto-summary', tenantId: 'tenant-1', name: 'Registrar resumo no histórico', description: 'Cada resumo de IA é gravado automaticamente no histórico do lead.', enabled: true, trigger: 'ai_summary', action: 'save_history' },
  { id: 'auto-idle', tenantId: 'tenant-1', name: 'Sinalizar lead sem ação', description: 'Adiciona uma sinalização visual quando o lead permanece sem movimentação.', enabled: true, trigger: 'stage_idle', delayHours: 24, action: 'attention_tag', lastRunAt: new Date().toISOString() },
  { id: 'auto-classify', tenantId: 'tenant-1', name: 'Classificar novos leads', description: 'Sugere prioridade após o primeiro atendimento.', enabled: false, trigger: 'new_lead', action: 'attention_tag' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      ...createDemoSnapshot(),
      automations: defaultAutomations,
      isInitialized: false,
      initError: null,
      loginError: null,
      activeTenantId: localStorage.getItem('activeTenantId'),

      login: async (email, password = '') => {
        const normalizedEmail = email.trim().toLowerCase();
        const user = demoUsers.find(item => item.email.toLowerCase() === normalizedEmail);
        const validDemoAccess = Boolean(user && password.length >= 6);
        if (!user || !validDemoAccess) {
          set({ loginError: 'E-mail ou senha inválidos.' });
          throw new Error('E-mail ou senha inválidos.');
        }
        localStorage.setItem('token', `mvp-${user.id}`);
        set({ currentUser: { ...user }, loginError: null, isInitialized: false });
        await get().initializeData();
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('activeTenantId');
        set({ currentUser: null, activeTenantId: null, isInitialized: false, loginError: null });
      },
      initializeData: async () => {
        if (!get().currentUser) return;
        // O MVP sempre recompõe a história comercial ao abrir uma nova sessão.
        const snapshot = createDemoSnapshot();
        set({ ...snapshot, automations: defaultAutomations, isInitialized: true, initError: null });
      },
      setActiveTenantId: async id => {
        if (id) localStorage.setItem('activeTenantId', id);
        else localStorage.removeItem('activeTenantId');
        set({ activeTenantId: id, isInitialized: true });
      },
      addTenant: async data => { set(state => ({ tenants: [...state.tenants, { ...data, id: generateId(), createdAt: new Date().toISOString(), status: 'active' }] })); },
      updateTenantSettings: async (tenantId, settings) => { set(state => ({ tenants: state.tenants.map(t => t.id === tenantId ? { ...t, settings: { ...t.settings, ...settings } } : t) })); },
      addUser: user => set(state => ({ users: [...state.users, { ...user, id: generateId() }] })),
      updateUser: (id, updates) => set(state => ({ users: state.users.map(user => user.id === id ? { ...user, ...updates } : user) })),
      createTag: async (name, color) => { set(state => ({ tags: [{ id: generateId(), tenantId: get().activeTenantId || get().currentUser?.tenantId || 'tenant-1', name, color, createdAt: new Date().toISOString() }, ...state.tags] })); },
      deleteTag: async id => { set(state => ({ tags: state.tags.filter(tag => tag.id !== id), leads: state.leads.map(lead => ({ ...lead, tags: lead.tags?.filter(tagId => tagId !== id) })) })); },
      createStage: async (pipelineId, name, order) => { set(state => ({ pipelines: state.pipelines.map(p => p.id === pipelineId ? { ...p, stages: [...p.stages, { id: generateId(), name, order }] } : p) })); },
      deleteStage: async id => { set(state => ({ pipelines: state.pipelines.map(p => ({ ...p, stages: p.stages.filter(stage => stage.id !== id) })) })); },
      reorderStages: async (pipelineId, stageIds) => { set(state => ({ pipelines: state.pipelines.map(p => p.id === pipelineId ? { ...p, stages: stageIds.map((id, order) => ({ ...p.stages.find(stage => stage.id === id)!, order })) } : p) })); },
      addLead: async lead => {
        const id = generateId();
        const createdAt = new Date().toISOString();
        const newLead = { ...lead, id, createdAt, updatedAt: createdAt, attachments: [], history: [] } as Lead;
        set(state => ({ leads: [newLead, ...state.leads], conversations: [{ id: generateId(), tenantId: lead.tenantId, leadId: id, status: 'unassigned', createdAt, updatedAt: createdAt }, ...state.conversations] }));
      },
      updateLead: async (id, updates) => { set(state => ({ leads: state.leads.map(lead => lead.id === id ? { ...lead, ...updates, updatedAt: new Date().toISOString() } : lead) })); },
      setLeadClassification: (id, classification, details, classifiedAt) => set(state => ({ leads: state.leads.map(lead => lead.id === id ? { ...lead, classification, classificationDetails: details, classifiedAt: classifiedAt || new Date().toISOString() } : lead) })),
      moveLead: async (leadId, newStageId) => {
        const stage = get().pipelines.flatMap(p => p.stages).find(item => item.id === newStageId);
        set(state => ({ leads: state.leads.map(lead => lead.id === leadId ? { ...lead, stageId: newStageId, updatedAt: new Date().toISOString(), attentionSince: undefined, history: [{ id: generateId(), type: 'stage_change', title: 'Mudança de etapa', content: `Lead movido para ${stage?.name || 'nova etapa'}.`, createdAt: new Date().toISOString(), createdBy: get().currentUser?.id }, ...(lead.history || [])] } : lead) }));
      },
      addLeadHistory: (leadId, entry) => set(state => ({ leads: state.leads.map(lead => lead.id === leadId ? { ...lead, history: [{ ...entry, id: generateId(), createdAt: new Date().toISOString() }, ...(lead.history || [])] } : lead) })),
      addLeadAttachment: (leadId, file) => set(state => ({ leads: state.leads.map(lead => lead.id === leadId ? { ...lead, attachments: [...(lead.attachments || []), { id: generateId(), name: file.name, type: file.type || 'application/octet-stream', size: file.size, createdAt: new Date().toISOString() }] } : lead) })),
      removeLeadAttachment: (leadId, attachmentId) => set(state => ({ leads: state.leads.map(lead => lead.id === leadId ? { ...lead, attachments: lead.attachments?.filter(item => item.id !== attachmentId) } : lead) })),
      addConversation: async (leadId, tenantId) => { set(state => ({ conversations: [{ id: generateId(), tenantId, leadId, status: 'unassigned', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...state.conversations] })); },
      fetchMessages: async () => undefined,
      addMessage: async (conversationId, senderId, text) => { set(state => ({ messages: [...state.messages, { id: generateId(), conversationId, senderId, text, createdAt: new Date().toISOString() }], conversations: state.conversations.map(c => c.id === conversationId ? { ...c, updatedAt: new Date().toISOString() } : c) })); },
      assignConversation: async (conversationId, userId) => { set(state => ({ conversations: state.conversations.map(c => c.id === conversationId ? { ...c, assignedTo: userId, status: 'assigned' } : c) })); },
      updateConversationStatus: async (conversationId, status) => { set(state => ({ conversations: state.conversations.map(c => c.id === conversationId ? { ...c, status, updatedAt: new Date().toISOString() } : c) })); },
      createQuickReply: async (title, text, category) => { set(state => ({ quickReplies: [{ id: generateId(), tenantId: get().currentUser?.tenantId || 'tenant-1', title, text, category }, ...state.quickReplies] })); },
      deleteQuickReply: async id => { set(state => ({ quickReplies: state.quickReplies.filter(reply => reply.id !== id) })); },
      saveAutomation: rule => set(state => ({ automations: state.automations.some(item => item.id === rule.id) ? state.automations.map(item => item.id === rule.id ? rule : item) : [rule, ...state.automations] })),
      deleteAutomation: id => set(state => ({ automations: state.automations.filter(rule => rule.id !== id) })),
    }),
    {
      name: 'crm-storage',
      partialize: state => ({ currentUser: state.currentUser }),
    },
  ),
);
