// Adaptador exclusivo da branch demo/rebuild-localstorage.
// Nenhuma chamada HTTP é feita para o backend real. As telas que ainda chamam fetchApi
// diretamente recebem respostas derivadas do snapshot fictício salvo no navegador.

function demoState(): any {
  try {
    const raw = localStorage.getItem('crm-demo-storage');
    return raw ? JSON.parse(raw)?.state || {} : {};
  } catch {
    return {};
  }
}

function tenantId(state: any) {
  return state.activeTenantId || state.currentUser?.tenantId || 'tenant-1';
}

function tenantData(state: any) {
  const id = tenantId(state);
  return {
    leads: (state.leads || []).filter((item: any) => item.tenantId === id),
    conversations: (state.conversations || []).filter((item: any) => item.tenantId === id),
    messages: state.messages || [],
  };
}

function dashboard(state: any) {
  const { leads, conversations, messages } = tenantData(state);
  const wonLeads = leads.filter((lead: any) => lead.status === 'won').length;
  const lostLeads = leads.filter((lead: any) => lead.status === 'lost').length;
  const activeLeads = leads.length - wonLeads - lostLeads;
  const openConversations = conversations.filter((item: any) => item.status !== 'closed').length;
  const closedConversations = conversations.filter((item: any) => item.status === 'closed').length;
  const waitingConversations = conversations.filter((item: any) => item.status === 'waiting_client').length;
  const conversationIds = new Set(conversations.map((item: any) => item.id));
  const scopedMessages = messages.filter((item: any) => conversationIds.has(item.conversationId));
  const sentMessages = scopedMessages.filter((item: any) => item.senderType === 'user' || item.senderId?.startsWith('user')).length;
  const receivedMessages = Math.max(0, scopedMessages.length - sentMessages);
  const pipeline = (state.pipelines || []).find((item: any) => item.tenantId === tenantId(state));
  const leadsByStage = (pipeline?.stages || []).map((stage: any) => ({ stage_name: stage.name, count: leads.filter((lead: any) => lead.stageId === stage.id).length }));
  return { activeLeads, wonLeads, lostLeads, openConversations, closedConversations, waitingConversations, sentMessages, receivedMessages, totalAiTokens: 18420, totalAiCalls: 37, leadsByStage, aiUsageByAction: [{ action: 'classify', count: 18, tokens: 6200 }, { action: 'summarize', count: 11, tokens: 7480 }, { action: 'suggest_reply', count: 8, tokens: 4740 }] };
}

function aiResponse(body: any) {
  if (body.action === 'classify') return { classification: 'quente', classificationDetails: { reason: 'Lead demonstrou interesse e possui interação recente.' }, classifiedAt: new Date().toISOString() };
  if (body.action === 'summarize') return { summary: 'Cliente demonstrou interesse na solução, pediu detalhes comerciais e aguarda o próximo contato da equipe.' };
  if (body.action === 'suggest_reply') return { suggestion: 'Olá! Obrigado pelo contato. Posso te apresentar os próximos passos e esclarecer suas dúvidas.' };
  return { success: true };
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const state = demoState();
  const method = String(options.method || 'GET').toUpperCase();
  const body = typeof options.body === 'string' ? JSON.parse(options.body || '{}') : {};

  if (endpoint === '/dashboard/tenant') return dashboard(state);
  if (endpoint === '/mvp/ai' && method === 'POST') return aiResponse(body);
  if (/^\/leads\/[^/]+\/source-history$/.test(endpoint)) {
    const leadId = endpoint.split('/')[2];
    const lead = (state.leads || []).find((item: any) => item.id === leadId);
    if (!lead) return [];
    return [{ id: `demo-source-${lead.id}`, lead_id: lead.id, source: lead.source || 'Demonstração', source_type: lead.sourceType || 'manual', created_at: lead.createdAt }];
  }
  if (endpoint === '/ai/settings') return { provider: 'openai', model: 'demo', enabled: true };
  if (endpoint === '/whatsapp/settings' || endpoint === '/meta/settings') return { configured: true, status: 'connected', phone_number: '+55 21 99999-0000', display_name: 'CRM Flow Demo' };
  if (endpoint === '/knowledge-bases') return [];
  if (endpoint.startsWith('/knowledge-bases')) return { success: true, id: `demo-${Date.now()}` };

  // Endpoints não essenciais à demonstração retornam sucesso controlado em vez de
  // atingir produção. Se uma nova tela precisar de payload específico, ela deve ser
  // adicionada explicitamente aqui.
  return { success: true, demo: true };
}
