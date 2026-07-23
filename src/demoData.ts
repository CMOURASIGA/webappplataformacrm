import { Conversation, Lead, Message, Pipeline, QuickReply, Tenant, TenantTag, User } from './types';

const now = Date.now();
const ago = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString();

export const demoUsers: User[] = [
  { id: 'master-1', name: 'Master Demonstração', email: 'master@crm.com', role: 'master' },
  { id: 'admin-1', tenantId: 'tenant-1', name: 'Admin Demonstração', email: 'admin@cliente.com', role: 'admin' },
  { id: 'agent-1', tenantId: 'tenant-1', name: 'Atendente Demonstração', email: 'atendente@cliente.com', role: 'user' },
  { id: 'agent-2', tenantId: 'tenant-1', name: 'Atendente Apoio', email: 'apoio@cliente.com', role: 'user' },
];

export const demoTenants: Tenant[] = [{
  id: 'tenant-1',
  name: 'Horizonte Empreendimentos',
  status: 'active',
  createdAt: ago(720),
  settings: {
    companyName: 'Horizonte Empreendimentos',
    primaryColor: '#4f46e5',
    logoUrl: '',
    sidebarColor: '#0f172a',
    sidebarTextColor: '#cbd5e1',
  },
}];

export const demoPipelines: Pipeline[] = [{
  id: 'pipeline-1',
  tenantId: 'tenant-1',
  name: 'Funil Comercial',
  stages: [
    { id: 'stage-new', name: 'Novos contatos', order: 0 },
    { id: 'stage-contact', name: 'Em atendimento', order: 1 },
    { id: 'stage-proposal', name: 'Proposta enviada', order: 2 },
    { id: 'stage-decision', name: 'Em decisão', order: 3 },
    { id: 'stage-won', name: 'Fechados', order: 4 },
  ],
}];

export const demoTags: TenantTag[] = [
  { id: 'tag-hot', tenantId: 'tenant-1', name: 'Prioridade', color: '#dc2626', createdAt: ago(300) },
  { id: 'tag-follow', tenantId: 'tenant-1', name: 'Follow-up hoje', color: '#d97706', createdAt: ago(250) },
  { id: 'tag-vip', tenantId: 'tenant-1', name: 'Investidor', color: '#7c3aed', createdAt: ago(200) },
];

export const demoLeads: Lead[] = [
  { id: 'lead-1', tenantId: 'tenant-1', name: 'Lead Demonstração 01', phone: '+55 00 00000-0001', email: 'lead01@example.invalid', company: 'Empresa Exemplo', source: 'Instagram', classification: 'quente', status: 'negotiation', assignedTo: 'agent-1', stageId: 'stage-proposal', pipelineId: 'pipeline-1', createdAt: ago(72), updatedAt: ago(2), notes: 'Procura uma unidade de 2 quartos. Visita realizada.', tags: ['tag-hot'], attentionSince: ago(26), attachments: [{ id: 'att-1', name: 'simulacao_financiamento.pdf', type: 'application/pdf', size: 248000, createdAt: ago(24) }], history: [{ id: 'hist-1', type: 'ai_summary', title: 'Resumo do atendimento', content: 'O lead confirmou interesse na unidade de 2 quartos. A simulação foi enviada e a próxima ação é confirmar a análise de crédito.', createdAt: ago(2), createdBy: 'agent-1' }] },
  { id: 'lead-2', tenantId: 'tenant-1', name: 'Lead Demonstração 02', phone: '+55 00 00000-0002', email: 'lead02@example.invalid', source: 'Landing page', classification: 'morno', status: 'in_progress', assignedTo: 'agent-2', stageId: 'stage-contact', pipelineId: 'pipeline-1', createdAt: ago(48), updatedAt: ago(15), notes: 'Quer receber tabela atualizada.', tags: ['tag-follow'], attentionSince: ago(15), attachments: [], history: [] },
  { id: 'lead-3', tenantId: 'tenant-1', name: 'Lead Demonstração 03', phone: '+55 00 00000-0003', source: 'Indicação', classification: 'quente', status: 'waiting', assignedTo: 'agent-1', stageId: 'stage-decision', pipelineId: 'pipeline-1', createdAt: ago(168), updatedAt: ago(30), notes: 'Decisão em conjunto com a família.', tags: ['tag-vip', 'tag-follow'], attentionSince: ago(30), attachments: [{ id: 'att-2', name: 'documentos_proposta.zip', type: 'application/zip', size: 840000, createdAt: ago(50) }], history: [] },
  { id: 'lead-4', tenantId: 'tenant-1', name: 'Lead Demonstração 04', phone: '+55 00 00000-0004', email: 'lead04@example.invalid', source: 'WhatsApp', classification: 'frio', status: 'new', stageId: 'stage-new', pipelineId: 'pipeline-1', createdAt: ago(6), updatedAt: ago(6), notes: 'Primeiro contato, pediu informações gerais.', tags: [], attachments: [], history: [] },
  { id: 'lead-5', tenantId: 'tenant-1', name: 'Lead Demonstração 05', phone: '+55 00 00000-0005', source: 'Evento', classification: 'quente', status: 'won', assignedTo: 'agent-2', stageId: 'stage-won', pipelineId: 'pipeline-1', createdAt: ago(360), updatedAt: ago(12), notes: 'Contrato assinado.', tags: [], attachments: [], history: [] },
];

export const demoConversations: Conversation[] = demoLeads.map((lead, index) => ({
  id: `conv-${index + 1}`,
  tenantId: lead.tenantId,
  leadId: lead.id,
  assignedTo: lead.assignedTo,
  status: lead.assignedTo ? 'in_progress' : 'unassigned',
  createdAt: lead.createdAt,
  updatedAt: lead.updatedAt,
}));

export const demoMessages: Message[] = [
  { id: 'msg-1', conversationId: 'conv-1', senderId: 'lead', text: 'Olá, gostei da unidade de 2 quartos. Ainda está disponível?', createdAt: ago(5) },
  { id: 'msg-2', conversationId: 'conv-1', senderId: 'agent-1', text: 'Olá! Está sim. Vou enviar a simulação atualizada.', createdAt: ago(4.8) },
  { id: 'msg-3', conversationId: 'conv-1', senderId: 'lead', text: 'Perfeito. Minha renda já foi enviada para análise.', createdAt: ago(3) },
  { id: 'msg-4', conversationId: 'conv-2', senderId: 'lead', text: 'Pode me mandar a tabela e as condições de entrada?', createdAt: ago(16) },
  { id: 'msg-5', conversationId: 'conv-2', senderId: 'agent-2', text: 'Claro. Vou separar as opções que melhor se encaixam.', createdAt: ago(15) },
  { id: 'msg-6', conversationId: 'conv-3', senderId: 'lead', text: 'Vou conversar com minha família e retorno amanhã.', createdAt: ago(30) },
  { id: 'msg-7', conversationId: 'conv-4', senderId: 'lead', text: 'Queria entender valores e localização.', createdAt: ago(6) },
];

export const demoQuickReplies: QuickReply[] = [
  { id: 'quick-1', tenantId: 'tenant-1', title: 'Boas-vindas', category: 'Atendimento', text: 'Olá! Sou da equipe Horizonte. Como posso ajudar?' },
  { id: 'quick-2', tenantId: 'tenant-1', title: 'Agendar visita', category: 'Comercial', text: 'Posso agendar uma visita. Qual dia e horário funciona melhor para você?' },
  { id: 'quick-3', tenantId: 'tenant-1', title: 'Retorno', category: 'Follow-up', text: 'Olá! Passando para saber se conseguiu avaliar as informações que enviamos.' },
];

export function createDemoSnapshot() {
  return {
    users: structuredClone(demoUsers),
    tenants: structuredClone(demoTenants),
    pipelines: structuredClone(demoPipelines),
    leads: structuredClone(demoLeads),
    conversations: structuredClone(demoConversations),
    messages: structuredClone(demoMessages),
    quickReplies: structuredClone(demoQuickReplies),
    tags: structuredClone(demoTags),
  };
}
