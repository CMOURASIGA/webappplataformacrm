import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const testDb = path.join(process.cwd(), '.tmp-epic09-test.db');
if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
process.env.CRM_DB_PATH = testDb;
process.env.JWT_SECRET = 'epic09-integration-secret';
process.env.NODE_ENV = 'test';

const { default: app } = await import('../server.ts');
const { closeDatabase } = await import('../src/db/index.ts');
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Servidor de teste nao iniciou');
const base = `http://127.0.0.1:${address.port}/api`;

async function request(endpoint: string, options: RequestInit = {}, token?: string, tenantId?: string) {
  const isForm = options.body instanceof FormData;
  const response = await fetch(`${base}${endpoint}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
      ...options.headers,
    },
  });
  const type = response.headers.get('content-type') || '';
  const body = response.status === 204 ? null : type.includes('json') ? await response.json() : await response.text();
  return { response, body };
}

try {
  const login = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'admin@cliente.com', password: 'admin123' }) });
  assert.equal(login.response.status, 200);
  const token = login.body.token as string;
  const agentLogin = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'atendente@cliente.com', password: 'atendente123' }) });
  const agentToken = agentLogin.body.token as string;

  const pipelines = (await request('/pipelines', {}, token)).body as any[];
  const pipeline = pipelines[0]; const stage = pipeline.stages[0];
  const leadResponse = await request('/leads', { method: 'POST', body: JSON.stringify({ name: 'Lead Epic 09', phone: '5511998877665', email: 'epic09@example.com', pipeline_id: pipeline.id, stage_id: stage.id }) }, token);
  assert.equal(leadResponse.response.status, 200);
  const lead = leadResponse.body;
  const conversation = (await request('/conversations', { method: 'POST', body: JSON.stringify({ lead_id: lead.id }) }, token)).body;

  await request(`/conversations/${conversation.id}/messages`, { method: 'POST', body: JSON.stringify({ text: 'Mensagem do primeiro ciclo' }) }, token);
  await request(`/conversations/${conversation.id}/messages`, { method: 'POST', body: JSON.stringify({ text: 'Cliente pediu uma proposta' }) }, token);
  const pending = await request(`/conversations/${conversation.id}/unregistered-messages`, {}, token);
  assert.equal(pending.body.count, 2);
  const generatedPreview = await request(`/conversations/${conversation.id}/service-records/preview`, { method: 'POST', body: '{}' }, token);
  assert.equal(generatedPreview.response.status, 200);
  assert.equal(generatedPreview.body.messageCount, 2);
  const recordPayload = {
    ...generatedPreview.body,
    summary: 'Cliente pediu uma proposta revisada pelo atendente.', topics: ['Proposta'], needs: ['Valores'], pendingItems: ['Enviar proposta'], nextAction: 'Enviar proposta',
  };
  const saved = await request(`/conversations/${conversation.id}/service-records`, { method: 'POST', body: JSON.stringify(recordPayload) }, token);
  assert.equal(saved.response.status, 201);
  assert.equal((await request(`/conversations/${conversation.id}/unregistered-messages`, {}, token)).body.count, 0);
  assert.equal((await request(`/conversations/${conversation.id}/service-records`, { method: 'POST', body: JSON.stringify(recordPayload) }, token)).response.status, 409);

  const agent = ((await request('/users', {}, token)).body as any[]).find(user => user.role === 'user');
  const direct = await request('/internal/channels', { method: 'POST', body: JSON.stringify({ type: 'direct', memberIds: [agent.id] }) }, token);
  assert.equal(direct.response.status, 201);
  const externalBefore = ((await request(`/conversations/${conversation.id}/messages`, {}, token)).body as any[]).length;
  await request(`/internal/channels/${direct.body.id}/messages`, { method: 'POST', body: JSON.stringify({ text: `@${agent.name} valide a proposta` }) }, token);
  assert.equal(((await request(`/conversations/${conversation.id}/messages`, {}, token)).body as any[]).length, externalBefore, 'chat interno nao pode alterar mensagens externas');
  const agentChannels = await request('/internal/channels', {}, agentToken);
  assert.ok(agentChannels.body.find((channel: any) => channel.id === direct.body.id)?.unreadCount >= 1);

  const leadChannel = await request(`/leads/${lead.id}/internal-channel`, {}, token);
  const decision = await request(`/internal/channels/${leadChannel.body.id}/service-record`, { method: 'POST', body: JSON.stringify({ summary: 'Desconto aprovado internamente.', decisions: ['Aprovar 10%'], pendingItems: [], nextAction: 'Enviar proposta final' }) }, token);
  assert.equal(decision.response.status, 201);
  const history = await request(`/leads/${lead.id}/service-records`, {}, token);
  assert.ok(history.body.some((record: any) => record.source === 'internal_chat'));
  assert.ok(history.body.some((record: any) => record.source === 'external_conversation'));

  const csv = ['nome;telefone;email;empresa;origem;responsavel;funil;etapa;tags;observacao', `Novo Importado;5511987654321;novo@example.com;Empresa;Evento;;${pipeline.name};${stage.name};vip, retorno;Teste`, `Repetido no arquivo;5511987654321;outro@example.com;;;;;;;`, `Duplicado;5511998877665;epic09@example.com;;;;;;;`, 'Invalido;;email-invalido;;;;;;;'].join('\r\n');
  const deniedForm = new FormData(); deniedForm.append('file', new Blob([csv], { type: 'text/csv' }), 'leads.csv');
  assert.equal((await request('/leads/import/preview', { method: 'POST', body: deniedForm }, agentToken)).response.status, 403);
  assert.equal((await request(`/users/${agent.id}/permissions`, { method: 'PATCH', body: JSON.stringify({ canImportLeads: true }) }, token)).response.status, 200);
  const form = new FormData(); form.append('file', new Blob([csv], { type: 'text/csv' }), 'leads.csv');
  const preview = await request('/leads/import/preview', { method: 'POST', body: form }, agentToken);
  assert.equal(preview.response.status, 200); assert.equal(preview.body.totalRows, 4); assert.equal(preview.body.duplicateRows, 2); assert.equal(preview.body.errorRows, 1);
  const execution = await request('/leads/import/execute', { method: 'POST', body: JSON.stringify({ fileName: 'leads.csv', duplicateMode: 'ignore', rows: preview.body.rows }) }, agentToken);
  assert.equal(execution.response.status, 201); assert.equal(execution.body.importedRows, 1); assert.equal(execution.body.duplicateRows, 2); assert.equal(execution.body.errorRows, 1);
  const errors = await request(`/leads/imports/${execution.body.batchId}/errors`, {}, agentToken);
  assert.equal(errors.response.status, 200); assert.match(errors.body, /Duplicidade ignorada/); assert.match(errors.body, /Telefone ausente ou invalido/);

  const master = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'master@crm.com', password: 'master123' }) });
  const isolated = await request(`/leads/${lead.id}/service-records`, {}, master.body.token, 'tenant-inexistente');
  assert.equal(isolated.response.status, 403, 'master nao pode selecionar tenant inexistente');
  const secondTenant = await request('/admin/tenants', { method: 'POST', body: JSON.stringify({ name: 'Tenant Isolado', company_name: 'Tenant Isolado', email: 'tenant2@example.com', admin_name: 'Admin Tenant 2', admin_email: 'admin2@example.com', admin_password: 'tenant2pass' }) }, master.body.token);
  assert.equal(secondTenant.response.status, 200);
  assert.equal((await request(`/leads/${lead.id}/service-records`, {}, master.body.token, secondTenant.body.tenantId)).response.status, 404);
  assert.equal(((await request('/internal/channels', {}, master.body.token, secondTenant.body.tenantId)).body as any[]).some(channel => channel.id === direct.body.id), false);
  console.log('Epic 09 integration tests: OK');
} finally {
  await new Promise<void>(resolve => server.close(() => resolve()));
  closeDatabase();
  if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
}
