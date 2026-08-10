import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const testDb = path.join(process.cwd(), '.tmp-attendance-feedback-test.db');
if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
process.env.CRM_DB_PATH = testDb;
process.env.JWT_SECRET = 'attendance-feedback-integration-secret';
process.env.NODE_ENV = 'test';
process.env.CRON_SECRET = 'attendance-feedback-cron-secret';

const { default: app } = await import('../server.ts');
const { default: db } = await import('../src/db/index.ts');
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Servidor de teste nao iniciou');
const base = `http://127.0.0.1:${address.port}/api`;

async function request(endpoint: string, options: RequestInit = {}, token?: string) {
  const response = await fetch(`${base}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json();
  return { response, body };
}

try {
  const login = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'admin@cliente.com', password: 'admin123' }) });
  assert.equal(login.response.status, 200);
  const token = login.body.token as string;

  const settings = await request('/ai/settings', {
    method: 'PATCH',
    body: JSON.stringify({
      enabled: true,
      attendance_feedback_enabled: true,
      attendance_feedback_prompt: 'Avalie clareza e proximo passo. Nao apresente nota.',
      automatic_closure_enabled: true,
      automatic_closure_minutes: 60,
      model: 'test-model',
      monthly_token_limit: 100000,
    }),
  }, token);
  assert.equal(settings.response.status, 200);

  const pipelines = (await request('/pipelines', {}, token)).body as any[];
  const lead = (await request('/leads', {
    method: 'POST',
    body: JSON.stringify({ name: 'Lead Feedback', phone: '5511999990000', pipeline_id: pipelines[0].id, stage_id: pipelines[0].stages[0].id }),
  }, token)).body;
  const conversation = (await request('/conversations', { method: 'POST', body: JSON.stringify({ lead_id: lead.id }) }, token)).body;
  await request(`/conversations/${conversation.id}/messages`, { method: 'POST', body: JSON.stringify({ text: 'Bom dia, vou preparar sua proposta.' }) }, token);

  const closed = await request(`/conversations/${conversation.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'closed', close_reason: 'Resolvido' }) }, token);
  assert.equal(closed.response.status, 200);
  assert.equal(closed.body.status, 'closed');
  assert.equal(closed.body.aiFeedback.summary, 'Atendimento analisado para teste.');
  assert.equal(closed.body.aiFeedback.score, null);

  const stored = await request(`/conversations/${conversation.id}/attendance-feedback`, {}, token);
  assert.equal(stored.response.status, 200);
  assert.equal(stored.body.id, closed.body.aiFeedback.id);
  assert.deepEqual(stored.body.positivePoints, ['Comunicacao clara']);

  const exported = await request(`/attendance-feedback/${stored.body.id}/action`, { method: 'POST', body: JSON.stringify({ action: 'pdf_exported' }) }, token);
  assert.equal(exported.response.status, 200);

  await request(`/conversations/${conversation.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'reopened' }) }, token);
  await request(`/conversations/${conversation.id}/messages`, { method: 'POST', body: JSON.stringify({ text: 'Mensagem do novo ciclo.' }) }, token);
  db.prepare("UPDATE conversations SET updated_at = datetime('now', '-2 hours') WHERE id = ?").run(conversation.id);
  const automatic = await request('/jobs/automatic-conversation-closure', { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
  assert.equal(automatic.response.status, 200);
  assert.ok(automatic.body.processed >= 1);
  const automaticFeedback = await request(`/conversations/${conversation.id}/attendance-feedback`, {}, token);
  assert.equal(automaticFeedback.body.closureOrigin, 'automatic');
  assert.notEqual(automaticFeedback.body.id, stored.body.id);
  console.log('Attendance feedback integration tests: OK');
} finally {
  await new Promise<void>(resolve => server.close(() => resolve()));
  db.close();
  if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
}
