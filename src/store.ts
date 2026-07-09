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
  TenantTag,
} from './types';

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
  isInitialized: boolean;
  activeTenantId: string | null;

  // Actions
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  initializeData: () => Promise<void>;
  setActiveTenantId: (id: string | null) => Promise<void>;
  
  // Tenants
  addTenant: (data: any) => Promise<void>;
  updateTenantSettings: (tenantId: string, settings: any) => Promise<void>;
  
  // Users
  addUser: (user: Omit<User, 'id'>) => void;
  
  // Tags & Stages
  createTag: (name: string, color: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  createStage: (pipelineId: string, name: string, order: number) => Promise<void>;
  deleteStage: (id: string) => Promise<void>;

  // Leads & Pipeline
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  moveLead: (leadId: string, newStageId: string) => Promise<void>;
  
  // Chat
  addConversation: (leadId: string, tenantId: string) => Promise<void>;
  addMessage: (conversationId: string, senderId: string, text: string) => Promise<void>;
  assignConversation: (conversationId: string, userId: string) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  
  createQuickReply: (title: string, text: string) => Promise<void>;
  deleteQuickReply: (id: string) => Promise<void>;
}

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
      isInitialized: false,
      activeTenantId: localStorage.getItem('activeTenantId'),

      login: async (email, password = 'password') => {
        try {
          const res = await fetchApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
          });
          localStorage.setItem('token', res.token);
          set({ currentUser: res.user });
          await get().initializeData();
        } catch (error: any) {
          alert('Login failed: ' + error.message);
        }
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('activeTenantId');
        set({ currentUser: null, isInitialized: false, activeTenantId: null, tenants: [], leads: [], conversations: [], pipelines: [], tags: [], quickReplies: [] });
      },

      setActiveTenantId: async (id) => {
        if (id) {
          localStorage.setItem('activeTenantId', id);
        } else {
          localStorage.removeItem('activeTenantId');
        }
        set({ activeTenantId: id, isInitialized: false });
        await get().initializeData();
      },

      initializeData: async () => {
        const { currentUser, activeTenantId } = get();
        if (!currentUser) return;
        
        try {
          if (currentUser.role === 'master') {
            const tenants = await fetchApi('/admin/tenants');
            
            if (activeTenantId) {
              const [settings, pipelines, leads, conversations, tags, quickReplies] = await Promise.all([
                fetchApi('/tenant/settings'),
                fetchApi('/pipelines'),
                fetchApi('/leads'),
                fetchApi('/conversations'),
                fetchApi('/tags'),
                fetchApi('/quick-replies')
              ]);
              set({ tenants, pipelines, leads, conversations, tags, quickReplies, isInitialized: true });
            } else {
              set({ tenants, isInitialized: true });
            }
          } else {
            const [settings, pipelines, leads, conversations, tags, quickReplies] = await Promise.all([
              fetchApi('/tenant/settings'),
              fetchApi('/pipelines'),
              fetchApi('/leads'),
              fetchApi('/conversations'),
              fetchApi('/tags'),
              fetchApi('/quick-replies')
            ]);
            
            // Reconstruct tenant object for UI
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
                sidebarTextColor: settings.sidebar_text_color
              }
            };
            
            set({ tenants: [tenant], pipelines, leads, conversations, tags, quickReplies, isInitialized: true });
          }
        } catch (error) {
          console.error("Failed to initialize data:", error);
        }
      },

      addTenant: async (data) => {
        try {
          await fetchApi('/admin/tenants', {
            method: 'POST',
            body: JSON.stringify(data)
          });
          const tenants = await fetchApi('/admin/tenants');
          set({ tenants });
        } catch (error) {
          console.error("Failed to add tenant:", error);
        }
      },

      updateTenantSettings: async (tenantId, settings) => {
        try {
          await fetchApi('/tenant/settings', {
            method: 'PATCH',
            body: JSON.stringify({ 
              company_name: settings.companyName, 
              primary_color: settings.primaryColor, 
              logo_url: settings.logoUrl,
              sidebar_color: settings.sidebarColor,
              sidebar_text_color: settings.sidebarTextColor 
            })
          });
          set(state => ({
            tenants: state.tenants.map(t => 
              t.id === tenantId 
                ? { 
                    ...t, 
                    settings: { 
                      ...(t.settings || {}),
                      companyName: settings.companyName,
                      primaryColor: settings.primaryColor,
                      logoUrl: settings.logoUrl,
                      sidebarColor: settings.sidebarColor,
                      sidebarTextColor: settings.sidebarTextColor
                    } 
                  } 
                : t
            )
          }));
        } catch (error) {
          console.error("Failed to update settings", error);
        }
      },

      addUser: (user) => {
        set(state => ({ users: [...state.users, { ...user, id: generateId() }] }));
      },

      createTag: async (name, color) => {
        try {
          const newTag = await fetchApi('/tags', {
            method: 'POST',
            body: JSON.stringify({ name, color })
          });
          set(state => ({ tags: [newTag, ...state.tags] }));
        } catch (error) {
          console.error("Failed to create tag", error);
        }
      },

      deleteTag: async (id) => {
        try {
          await fetchApi(`/tags/${id}`, { method: 'DELETE' });
          set(state => ({ tags: state.tags.filter(t => t.id !== id) }));
        } catch (error) {
          console.error("Failed to delete tag", error);
        }
      },

      createStage: async (pipelineId, name, order) => {
        try {
          await fetchApi(`/pipelines/${pipelineId}/stages`, {
            method: 'POST',
            body: JSON.stringify({ name, order })
          });
          // Refresh pipelines
          const pipelines = await fetchApi('/pipelines');
          set({ pipelines });
        } catch (error) {
          console.error("Failed to create stage", error);
        }
      },

      deleteStage: async (id) => {
        try {
          await fetchApi(`/stages/${id}`, { method: 'DELETE' });
          // Refresh pipelines
          const pipelines = await fetchApi('/pipelines');
          set({ pipelines });
        } catch (error) {
          console.error("Failed to delete stage", error);
        }
      },

      addLead: async (lead) => {
        try {
          const newLead = await fetchApi('/leads', {
            method: 'POST',
            body: JSON.stringify({
              name: lead.name,
              phone: lead.phone,
              email: lead.email,
              company: lead.company,
              source: lead.source,
              stage_id: lead.stageId,
              pipeline_id: lead.pipelineId,
              tags: lead.tags || []
            })
          });
          
          // MAP snake_case to camelCase
          const formattedLead = {
            ...newLead,
            stageId: newLead.stage_id,
            pipelineId: newLead.pipeline_id,
            tenantId: newLead.tenant_id
          };
          
          set(state => ({
            leads: [formattedLead, ...state.leads]
          }));

          // Automatically create a conversation for the new lead
          await get().addConversation(formattedLead.id, formattedLead.tenantId);
        } catch (error) {
          console.error("Failed to add lead:", error);
        }
      },

      updateLead: async (id, updates) => {
        // Implement full update if needed
        set(state => ({
          leads: state.leads.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l)
        }));
      },

      moveLead: async (leadId, newStageId) => {
        try {
          await fetchApi(`/leads/${leadId}`, {
            method: 'PATCH',
            body: JSON.stringify({ stage_id: newStageId })
          });
          set(state => ({
            leads: state.leads.map(l => l.id === leadId ? { ...l, stageId: newStageId, updatedAt: new Date().toISOString() } : l)
          }));
        } catch (error) {
          console.error("Failed to move lead", error);
        }
      },

      addConversation: async (leadId, tenantId) => {
        try {
          const newConv = await fetchApi('/conversations', {
            method: 'POST',
            body: JSON.stringify({ lead_id: leadId })
          });
          
          set(state => {
            const exists = state.conversations.find(c => c.id === newConv.id);
            if (exists) return state;
            return {
              conversations: [newConv, ...state.conversations]
            };
          });
        } catch (error) {
          console.error("Failed to add conversation", error);
        }
      },
      
      fetchMessages: async (conversationId) => {
        try {
          const rawMsgs = await fetchApi(`/conversations/${conversationId}/messages`);
          const messages = rawMsgs.map((m: any) => ({
             ...m,
             conversationId: m.conversation_id,
             senderId: m.sender_id,
             createdAt: m.created_at
          }));
          
          // replace old messages for this convo
          set(state => ({
            messages: [...state.messages.filter(m => m.conversationId !== conversationId), ...messages]
          }));
        } catch (error) {
          console.error("Failed to fetch messages", error);
        }
      },

      addMessage: async (conversationId, senderId, text) => {
        try {
          const rawMsg = await fetchApi(`/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ text })
          });
          
          const newMsg = {
             ...rawMsg,
             conversationId: rawMsg.conversation_id,
             senderId: rawMsg.sender_id,
             createdAt: rawMsg.created_at
          };
          
          set(state => ({
            messages: [...state.messages, newMsg]
          }));
        } catch (error) {
          console.error("Failed to send message", error);
        }
      },

      assignConversation: (conversationId, userId) => {
        set(state => ({
          conversations: state.conversations.map(c => c.id === conversationId ? { ...c, assignedTo: userId, status: 'in_progress' } : c)
        }));
      },

      createQuickReply: async (title, text) => {
        try {
          const newReply = await fetchApi('/quick-replies', {
            method: 'POST',
            body: JSON.stringify({ title, text })
          });
          set(state => ({ quickReplies: [newReply, ...state.quickReplies] }));
        } catch (error) {
          console.error("Failed to create quick reply", error);
        }
      },

      deleteQuickReply: async (id) => {
        try {
          await fetchApi(`/quick-replies/${id}`, { method: 'DELETE' });
          set(state => ({ quickReplies: state.quickReplies.filter(r => r.id !== id) }));
        } catch (error) {
          console.error("Failed to delete quick reply", error);
        }
      }
    }),
    {
      name: 'crm-storage',
      partialize: (state) => ({ currentUser: state.currentUser }), // Only persist user info
    }
  )
);

