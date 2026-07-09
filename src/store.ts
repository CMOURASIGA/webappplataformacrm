import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User,
  Tenant,
  Pipeline,
  Lead,
  Conversation,
  Message,
  QuickReply,
} from './types';
import { generateId } from './lib/utils';

interface AppState {
  currentUser: User | null;
  users: User[];
  tenants: Tenant[];
  pipelines: Pipeline[];
  leads: Lead[];
  conversations: Conversation[];
  messages: Message[];
  quickReplies: QuickReply[];

  // Actions
  login: (email: string) => void;
  logout: () => void;
  
  // Tenants
  addTenant: (name: string) => void;
  updateTenantSettings: (tenantId: string, settings: any) => void;
  
  // Users
  addUser: (user: Omit<User, 'id'>) => void;
  
  // Leads & Pipeline
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  moveLead: (leadId: string, newStageId: string) => void;
  
  // Chat
  addConversation: (leadId: string, tenantId: string) => void;
  addMessage: (conversationId: string, senderId: string, text: string) => void;
  assignConversation: (conversationId: string, userId: string) => void;
}

const mockData = {
  users: [
    { id: 'u1', name: 'Master Admin', email: 'master@crm.com', role: 'master' as const },
    { id: 'u2', tenantId: 't1', name: 'Client Admin', email: 'admin@client.com', role: 'admin' as const },
    { id: 'u3', tenantId: 't1', name: 'Agent John', email: 'john@client.com', role: 'user' as const },
  ],
  tenants: [
    { 
      id: 't1', 
      name: 'Acme Corp', 
      settings: { primaryColor: '#3b82f6', logoUrl: '', companyName: 'Acme Corp' }, 
      createdAt: new Date().toISOString(), 
      status: 'active' as const 
    }
  ],
  pipelines: [
    {
      id: 'p1',
      tenantId: 't1',
      name: 'Vendas Padrão',
      stages: [
        { id: 's1', name: 'Novo Lead', order: 0 },
        { id: 's2', name: 'Primeiro Contato', order: 1 },
        { id: 's3', name: 'Em Negociação', order: 2 },
        { id: 's4', name: 'Proposta Enviada', order: 3 },
        { id: 's5', name: 'Fechado', order: 4 },
        { id: 's6', name: 'Perdido', order: 5 },
      ]
    }
  ]
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: mockData.users,
      tenants: mockData.tenants,
      pipelines: mockData.pipelines,
      leads: [
        {
          id: 'l1',
          tenantId: 't1',
          name: 'Maria Silva',
          phone: '+5511999999999',
          source: 'WhatsApp',
          status: 'new',
          stageId: 's1',
          pipelineId: 'p1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: ''
        },
        {
          id: 'l2',
          tenantId: 't1',
          name: 'João Pedro',
          phone: '+5511988888888',
          source: 'Site',
          status: 'in_progress',
          stageId: 's2',
          pipelineId: 'p1',
          assignedTo: 'u3',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: 'Cliente muito interessado.'
        }
      ],
      conversations: [
        {
          id: 'c1',
          tenantId: 't1',
          leadId: 'l1',
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      messages: [
        {
          id: 'm1',
          conversationId: 'c1',
          senderId: 'l1',
          text: 'Olá, gostaria de saber mais sobre o produto.',
          createdAt: new Date().toISOString()
        }
      ],
      quickReplies: [],

      login: (email) => {
        const user = get().users.find(u => u.email === email);
        if (user) {
          set({ currentUser: user });
        } else {
          alert('User not found. Use master@crm.com, admin@client.com, or john@client.com');
        }
      },
      logout: () => set({ currentUser: null }),

      addTenant: (name) => {
        const id = generateId();
        const newTenant: Tenant = {
          id,
          name,
          settings: { primaryColor: '#000000', logoUrl: '', companyName: name },
          createdAt: new Date().toISOString(),
          status: 'active'
        };
        const newAdmin: User = {
          id: generateId(),
          tenantId: id,
          name: `${name} Admin`,
          email: `admin@${name.toLowerCase().replace(/\\s/g, '')}.com`,
          role: 'admin'
        };
        const newPipeline: Pipeline = {
          id: generateId(),
          tenantId: id,
          name: 'Funil Padrão',
          stages: [
            { id: generateId(), name: 'Novo', order: 0 },
            { id: generateId(), name: 'Negociação', order: 1 },
            { id: generateId(), name: 'Fechado', order: 2 }
          ]
        };
        
        set(state => ({
          tenants: [...state.tenants, newTenant],
          users: [...state.users, newAdmin],
          pipelines: [...state.pipelines, newPipeline]
        }));
      },

      updateTenantSettings: (tenantId, settings) => {
        set(state => ({
          tenants: state.tenants.map(t => t.id === tenantId ? { ...t, settings: { ...t.settings, ...settings } } : t)
        }));
      },

      addUser: (user) => {
        set(state => ({ users: [...state.users, { ...user, id: generateId() }] }));
      },

      addLead: (lead) => {
        set(state => ({
          leads: [...state.leads, {
            ...lead,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }]
        }));
      },

      updateLead: (id, updates) => {
        set(state => ({
          leads: state.leads.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l)
        }));
      },

      moveLead: (leadId, newStageId) => {
        set(state => ({
          leads: state.leads.map(l => l.id === leadId ? { ...l, stageId: newStageId, updatedAt: new Date().toISOString() } : l)
        }));
      },

      addConversation: (leadId, tenantId) => {
        const id = generateId();
        set(state => ({
          conversations: [...state.conversations, {
            id,
            tenantId,
            leadId,
            status: 'new',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }]
        }));
      },

      addMessage: (conversationId, senderId, text) => {
        set(state => ({
          messages: [...state.messages, {
            id: generateId(),
            conversationId,
            senderId,
            text,
            createdAt: new Date().toISOString()
          }]
        }));
      },

      assignConversation: (conversationId, userId) => {
        set(state => ({
          conversations: state.conversations.map(c => c.id === conversationId ? { ...c, assignedTo: userId, status: 'in_progress' } : c)
        }));
      }

    }),
    {
      name: 'crm-storage',
    }
  )
);
