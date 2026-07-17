export type Role = 'master' | 'admin' | 'user';

export interface User {
  id: string;
  tenantId?: string; // undefined for master
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  password?: string; // Just for mockup login
}

export interface TenantSettings {
  primaryColor: string;
  logoUrl: string;
  companyName: string;
  sidebarColor?: string;
  sidebarTextColor?: string;
}

export interface Tenant {
  id: string;
  name: string;
  settings: TenantSettings;
  createdAt: string;
  status: 'active' | 'suspended';
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
}

export interface Pipeline {
  id: string;
  tenantId: string;
  name: string;
  stages: PipelineStage[];
}

export interface TenantTag {
  id: string;
  tenantId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  source: string;
  sourceType?: 'manual' | 'automatic';
  sourceCampaign?: string;
  sourcePage?: string;
  sourceCapturedAt?: string;
  status: 'new' | 'in_progress' | 'negotiation' | 'waiting' | 'won' | 'lost' | 'archived';
  assignedTo?: string; // userId
  stageId: string;
  pipelineId: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
  tags?: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string; // 'system', userId, or 'lead'
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  leadId: string;
  assignedTo?: string; // userId
  status: 'new' | 'unassigned' | 'assigned' | 'in_progress' | 'waiting_customer' | 'waiting_agent' | 'closed' | 'reopened' | 'transferred' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface QuickReply {
  id: string;
  tenantId: string;
  title: string;
  text: string;
  category: string;
}
