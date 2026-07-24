import type { Express, RequestHandler } from 'express';
import type Database from 'better-sqlite3';
import multer from 'multer';
import crypto from 'crypto';
import * as XLSX from 'xlsx';

type Commit = () => Promise<void>;
type AiPreview = (context: { tenantId: string; userId: string; conversation: any; messages: any[] }) => Promise<{ data: any; model: string }>;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const json = (value: unknown, fallback: any = []) => {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
};
const id = () => crypto.randomUUID();
const clean = (value: unknown) => String(value ?? '').trim();
const normalizedPhone = (value: unknown) => clean(value).replace(/\D/g, '');
const normalizedEmail = (value: unknown) => clean(value).toLowerCase();
const isAdmin = (user: any) => user.role === 'admin' || user.role === 'master';
const canImportLeads = (user: any) => isAdmin(user) || user.canImportLeads;

function audit(db: Database.Database, user: any, action: string, entityType: string, entityId: string | null, oldValue?: any, newValue?: any) {
  db.prepare(`INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, old_value, new_value)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id(), user.tenantId, user.id, action, entityType, entityId, oldValue == null ? null : JSON.stringify(oldValue), newValue == null ? null : JSON.stringify(newValue));
}

function canAccessLead(db: Database.Database, user: any, leadId: string) {
  if (isAdmin(user)) return db.prepare('SELECT * FROM leads WHERE id = ? AND tenant_id = ?').get(leadId, user.tenantId) as any;
  return db.prepare(`SELECT DISTINCT l.* FROM leads l LEFT JOIN conversations c ON c.lead_id = l.id AND c.tenant_id = l.tenant_id
    WHERE l.id = ? AND l.tenant_id = ? AND (l.assigned_to = ? OR l.owner_user_id = ? OR c.assigned_to = ? OR c.assigned_to IS NULL OR c.status IN ('new','unassigned'))`)
    .get(leadId, user.tenantId, user.id, user.id, user.id) as any;
}

function canAccessConversation(db: Database.Database, user: any, conversationId: string) {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ? AND tenant_id = ?').get(conversationId, user.tenantId) as any;
  return conversation && canAccessLead(db, user, conversation.lead_id) ? conversation : null;
}

function pendingMessages(db: Database.Database, conversationId: string) {
  const last = db.prepare(`SELECT last_message_id FROM lead_service_records
    WHERE conversation_id = ? AND source = 'external_conversation' ORDER BY created_at DESC, rowid DESC LIMIT 1`).get(conversationId) as any;
  if (!last?.last_message_id) {
    return db.prepare(`SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at, rowid`).all(conversationId) as any[];
  }
  const marker = db.prepare('SELECT created_at, rowid FROM messages WHERE id = ? AND conversation_id = ?').get(last.last_message_id, conversationId) as any;
  if (!marker) return [];
  return db.prepare(`SELECT * FROM messages WHERE conversation_id = ? AND (created_at > ? OR (created_at = ? AND rowid > ?)) ORDER BY created_at, rowid`)
    .all(conversationId, marker.created_at, marker.created_at, marker.rowid) as any[];
}

function formatRecord(row: any) {
  return {
    ...row,
    topics: json(row.topics_json), needs: json(row.needs_json), objections: json(row.objections_json),
    decisions: json(row.decisions_json), pendingItems: json(row.pending_items_json),
    attendantName: row.attendant_name, reviewedByName: row.reviewer_name,
  };
}

function formatChannel(row: any) {
  return { ...row, isPrivate: Boolean(row.is_private), unreadCount: Number(row.unread_count || 0), leadId: row.lead_id };
}

function channelForUser(db: Database.Database, user: any, channelId: string) {
  const channel = db.prepare(`SELECT c.* FROM internal_channels c
    LEFT JOIN internal_channel_members m ON m.channel_id = c.id AND m.user_id = ?
    WHERE c.id = ? AND c.tenant_id = ? AND (m.user_id IS NOT NULL OR (c.type = 'company' AND c.is_private = 0))`)
    .get(user.id, channelId, user.tenantId) as any;
  return channel;
}

const requiredColumns = ['nome', 'telefone'];
const templateColumns = ['nome', 'telefone', 'email', 'empresa', 'origem', 'responsavel', 'funil', 'etapa', 'tags', 'observacao'];

function parseImportFile(file: Express.Multer.File) {
  const ext = file.originalname.toLowerCase().split('.').pop();
  if (!['csv', 'xlsx'].includes(ext || '')) throw Object.assign(new Error('Formato invalido. Envie CSV ou XLSX.'), { status: 400 });
  const workbook = XLSX.read(file.buffer, { type: 'buffer', raw: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw Object.assign(new Error('Arquivo vazio.'), { status: 400 });
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });
  if (!rows.length) throw Object.assign(new Error('Arquivo vazio.'), { status: 400 });
  return rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value])));
}

function validateImportRows(db: Database.Database, tenantId: string, rows: Record<string, unknown>[]) {
  const headers = Object.keys(rows[0] || {});
  const missing = requiredColumns.filter(column => !headers.includes(column));
  if (missing.length) throw Object.assign(new Error(`Colunas obrigatorias ausentes: ${missing.join(', ')}`), { status: 400 });
  const users = db.prepare('SELECT id, name, email FROM users WHERE tenant_id = ?').all(tenantId) as any[];
  const pipelines = db.prepare('SELECT id, name FROM pipelines WHERE tenant_id = ?').all(tenantId) as any[];
  const stages = db.prepare(`SELECT ps.id, ps.name, ps.pipeline_id FROM pipeline_stages ps JOIN pipelines p ON p.id = ps.pipeline_id WHERE p.tenant_id = ?`).all(tenantId) as any[];
  const existingLeads = db.prepare('SELECT id, name, phone, email FROM leads WHERE tenant_id = ?').all(tenantId) as any[];
  const seenPhones = new Map<string, number>();
  const seenEmails = new Map<string, number>();
  const findNamed = (items: any[], value: string) => items.find(item => item.name.toLowerCase() === value.toLowerCase() || item.email?.toLowerCase() === value.toLowerCase());

  return rows.map((raw, index) => {
    const data: any = {
      name: clean(raw.nome), phone: normalizedPhone(raw.telefone), email: normalizedEmail(raw.email), company: clean(raw.empresa),
      source: clean(raw.origem) || 'Importacao', notes: clean(raw.observacao), tags: clean(raw.tags).split(',').map(item => item.trim()).filter(Boolean),
      responsible: clean(raw.responsavel), pipeline: clean(raw.funil), stage: clean(raw.etapa),
    };
    const errors: string[] = [];
    if (!data.name) errors.push('Nome ausente');
    if (!data.phone || data.phone.length < 8 || data.phone.length > 15) errors.push('Telefone ausente ou invalido');
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Email invalido');
    const pipeline = data.pipeline ? findNamed(pipelines, data.pipeline) : pipelines[0];
    const stage = data.stage ? stages.find(item => item.name.toLowerCase() === data.stage.toLowerCase() && (!pipeline || item.pipeline_id === pipeline.id)) : stages.find(item => item.pipeline_id === pipeline?.id);
    const responsible = data.responsible ? findNamed(users, data.responsible) : null;
    if (data.pipeline && !pipeline) errors.push('Funil inexistente');
    if (data.stage && !stage) errors.push('Etapa inexistente');
    if (data.responsible && !responsible) errors.push('Responsavel inexistente');
    if (!pipeline || !stage) errors.push('Tenant sem funil e etapa padrao validos');
    data.pipelineId = pipeline?.id || null; data.stageId = stage?.id || null; data.responsibleId = responsible?.id || null;
    const databaseDuplicate = existingLeads.find(lead => (data.phone && normalizedPhone(lead.phone) === data.phone) || (data.email && normalizedEmail(lead.email) === data.email));
    const repeatedAt = (data.phone && seenPhones.get(data.phone)) || (data.email && seenEmails.get(data.email));
    const fileDuplicate = repeatedAt ? { id: null, name: `Linha ${repeatedAt}`, source: 'file' } : null;
    if (data.phone && !seenPhones.has(data.phone)) seenPhones.set(data.phone, index + 2);
    if (data.email && !seenEmails.has(data.email)) seenEmails.set(data.email, index + 2);
    return { rowNumber: index + 2, raw, data, errors, duplicate: databaseDuplicate ? { ...databaseDuplicate, source: 'database' } : fileDuplicate };
  });
}

function csvCell(value: unknown) {
  let text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function registerEpic09Routes(app: Express, db: Database.Database, authenticate: RequestHandler, commit: Commit, generatePreview: AiPreview) {
  app.patch('/api/users/:userId/permissions', authenticate, async (req: any, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ error: 'Apenas administradores gerenciam permissoes' });
    const target = db.prepare('SELECT id, role, can_import_leads FROM users WHERE id = ? AND tenant_id = ?').get(req.params.userId, req.user.tenantId) as any;
    if (!target) return res.status(404).json({ error: 'Usuario nao encontrado' });
    const enabled = req.body.canImportLeads === true ? 1 : 0;
    db.prepare('UPDATE users SET can_import_leads = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?').run(enabled, target.id, req.user.tenantId);
    audit(db, req.user, 'user.permissions.updated', 'users', target.id, { canImportLeads: Boolean(target.can_import_leads) }, { canImportLeads: Boolean(enabled) });
    await commit(); res.json({ id: target.id, canImportLeads: Boolean(enabled) });
  });

  app.get('/api/leads/service-overview', authenticate, (req: any, res) => {
    const leads = (isAdmin(req.user)
      ? db.prepare('SELECT id FROM leads WHERE tenant_id = ?').all(req.user.tenantId)
      : db.prepare(`SELECT DISTINCT l.id FROM leads l LEFT JOIN conversations c ON c.lead_id = l.id WHERE l.tenant_id = ? AND (l.assigned_to = ? OR l.owner_user_id = ? OR c.assigned_to = ? OR c.assigned_to IS NULL)`).all(req.user.tenantId, req.user.id, req.user.id, req.user.id)) as any[];
    const result: Record<string, any> = {};
    for (const lead of leads) {
      const latest = db.prepare(`SELECT r.*, u.name attendant_name FROM lead_service_records r LEFT JOIN users u ON u.id = r.attendant_id WHERE r.tenant_id = ? AND r.lead_id = ? ORDER BY r.created_at DESC LIMIT 1`).get(req.user.tenantId, lead.id) as any;
      const conversation = db.prepare('SELECT id FROM conversations WHERE tenant_id = ? AND lead_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.tenantId, lead.id) as any;
      result[lead.id] = { latest: latest ? formatRecord(latest) : null, pendingCount: conversation ? pendingMessages(db, conversation.id).length : 0 };
    }
    res.json(result);
  });

  app.get('/api/conversations/:conversationId/unregistered-messages', authenticate, (req: any, res) => {
    const conversation = canAccessConversation(db, req.user, req.params.conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversa nao encontrada ou sem permissao' });
    const messages = pendingMessages(db, conversation.id);
    res.json({ count: messages.length, firstMessage: messages[0] || null, lastMessage: messages.at(-1) || null, messages });
  });

  app.post('/api/conversations/:conversationId/service-records/preview', authenticate, async (req: any, res) => {
    try {
      const conversation = canAccessConversation(db, req.user, req.params.conversationId);
      if (!conversation) return res.status(404).json({ error: 'Conversa nao encontrada ou sem permissao' });
      const messages = pendingMessages(db, conversation.id);
      if (!messages.length) return res.status(409).json({ error: 'Nao existem novas mensagens para registrar.' });
      const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND tenant_id = ?').get(conversation.lead_id, req.user.tenantId);
      const generated = await generatePreview({ tenantId: req.user.tenantId, userId: req.user.id, conversation: { ...conversation, lead }, messages });
      res.json({ ...generated.data, aiModel: generated.model, startedAt: messages[0].created_at, endedAt: messages.at(-1).created_at, firstMessageId: messages[0].id, lastMessageId: messages.at(-1).id, messageCount: messages.length, attendantId: req.user.id, channel: messages[0].channel || 'whatsapp', generatedAt: new Date().toISOString() });
    } catch (error: any) {
      console.error('Service record preview failed', { tenantId: req.user.tenantId, userId: req.user.id, conversationId: req.params.conversationId, error: error.message });
      res.status(error.status || 500).json({ error: error.message || 'Falha ao gerar previa' });
    }
  });

  app.post('/api/conversations/:conversationId/service-records', authenticate, async (req: any, res) => {
    const conversation = canAccessConversation(db, req.user, req.params.conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversa nao encontrada ou sem permissao' });
    const messages = pendingMessages(db, conversation.id);
    const body = req.body || {};
    if (!messages.length || body.firstMessageId !== messages[0].id || body.lastMessageId !== messages.at(-1).id || Number(body.messageCount) !== messages.length) {
      return res.status(409).json({ error: 'O conjunto de mensagens mudou. Gere uma nova previa.' });
    }
    if (!clean(body.summary)) return res.status(400).json({ error: 'Resumo e obrigatorio' });
    const recordId = id();
    try {
      db.prepare(`INSERT INTO lead_service_records (id, tenant_id, lead_id, conversation_id, attendant_id, source, channel, started_at, ended_at, first_message_id, last_message_id, message_count, summary, topics_json, needs_json, objections_json, decisions_json, pending_items_json, next_action, next_action_due_at, sentiment, ai_model, generated_at, reviewed_by, reviewed_at)
        VALUES (?, ?, ?, ?, ?, 'external_conversation', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
        .run(recordId, req.user.tenantId, conversation.lead_id, conversation.id, req.user.id, clean(body.channel) || 'whatsapp', body.startedAt, body.endedAt, body.firstMessageId, body.lastMessageId, messages.length, clean(body.summary), JSON.stringify(body.topics || []), JSON.stringify(body.needs || []), JSON.stringify(body.objections || []), JSON.stringify(body.decisions || []), JSON.stringify(body.pendingItems || []), clean(body.nextAction) || null, body.nextActionDueAt || null, clean(body.sentiment) || null, clean(body.aiModel) || null, body.generatedAt || new Date().toISOString(), req.user.id);
      audit(db, req.user, 'service_record.created', 'lead_service_records', recordId, null, { leadId: conversation.lead_id, messageCount: messages.length });
      await commit();
      res.status(201).json(formatRecord(db.prepare(`SELECT r.*, u.name attendant_name, rv.name reviewer_name FROM lead_service_records r LEFT JOIN users u ON u.id = r.attendant_id LEFT JOIN users rv ON rv.id = r.reviewed_by WHERE r.id = ?`).get(recordId)));
    } catch (error: any) { res.status(409).json({ error: 'Estas mensagens ja foram registradas ou o registro e invalido.' }); }
  });

  app.get('/api/leads/:leadId/service-records', authenticate, (req: any, res) => {
    if (!canAccessLead(db, req.user, req.params.leadId)) return res.status(404).json({ error: 'Lead nao encontrado ou sem permissao' });
    const conditions = ['r.tenant_id = ?', 'r.lead_id = ?']; const params: any[] = [req.user.tenantId, req.params.leadId];
    if (req.query.period === 'today') conditions.push("date(r.created_at, 'localtime') = date('now', 'localtime')");
    if (req.query.period === '7days') conditions.push("r.created_at >= datetime('now', '-7 days')");
    if (req.query.attendantId) { conditions.push('r.attendant_id = ?'); params.push(req.query.attendantId); }
    if (req.query.pending === 'true') conditions.push("r.pending_items_json != '[]'");
    if (req.query.nextAction === 'true') conditions.push("r.next_action IS NOT NULL AND trim(r.next_action) != ''");
    const rows = db.prepare(`SELECT r.*, u.name attendant_name, rv.name reviewer_name FROM lead_service_records r LEFT JOIN users u ON u.id = r.attendant_id LEFT JOIN users rv ON rv.id = r.reviewed_by WHERE ${conditions.join(' AND ')} ORDER BY r.started_at DESC, r.created_at DESC`).all(...params) as any[];
    res.json(rows.map(formatRecord));
  });

  app.get('/api/service-records/:recordId', authenticate, (req: any, res) => {
    const row = db.prepare(`SELECT r.*, u.name attendant_name, rv.name reviewer_name FROM lead_service_records r LEFT JOIN users u ON u.id = r.attendant_id LEFT JOIN users rv ON rv.id = r.reviewed_by WHERE r.id = ? AND r.tenant_id = ?`).get(req.params.recordId, req.user.tenantId) as any;
    if (!row || !canAccessLead(db, req.user, row.lead_id)) return res.status(404).json({ error: 'Registro nao encontrado' });
    res.json(formatRecord(row));
  });

  app.put('/api/service-records/:recordId', authenticate, async (req: any, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ error: 'Apenas administradores podem corrigir registros salvos' });
    const old = db.prepare('SELECT * FROM lead_service_records WHERE id = ? AND tenant_id = ?').get(req.params.recordId, req.user.tenantId) as any;
    if (!old) return res.status(404).json({ error: 'Registro nao encontrado' });
    const body = req.body || {};
    db.prepare(`UPDATE lead_service_records SET summary = ?, topics_json = ?, needs_json = ?, objections_json = ?, decisions_json = ?, pending_items_json = ?, next_action = ?, next_action_due_at = ?, sentiment = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`)
      .run(clean(body.summary || old.summary), JSON.stringify(body.topics ?? json(old.topics_json)), JSON.stringify(body.needs ?? json(old.needs_json)), JSON.stringify(body.objections ?? json(old.objections_json)), JSON.stringify(body.decisions ?? json(old.decisions_json)), JSON.stringify(body.pendingItems ?? json(old.pending_items_json)), clean(body.nextAction) || null, body.nextActionDueAt || null, clean(body.sentiment) || null, req.user.id, old.id, req.user.tenantId);
    audit(db, req.user, 'service_record.updated', 'lead_service_records', old.id, old, req.body); await commit();
    res.json(formatRecord(db.prepare('SELECT * FROM lead_service_records WHERE id = ?').get(old.id)));
  });

  app.get('/api/internal/channels', authenticate, (req: any, res) => {
    const rows = db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM internal_messages im WHERE im.channel_id = c.id AND im.deleted_at IS NULL AND im.sender_id != ? AND im.created_at > COALESCE(m.last_read_at, m.joined_at)) unread_count
      FROM internal_channels c LEFT JOIN internal_channel_members m ON m.channel_id = c.id AND m.user_id = ?
      WHERE c.tenant_id = ? AND (m.user_id IS NOT NULL OR (c.type = 'company' AND c.is_private = 0)) ORDER BY c.updated_at DESC`).all(req.user.id, req.user.id, req.user.tenantId) as any[];
    res.json(rows.map(formatChannel));
  });

  app.post('/api/internal/channels', authenticate, async (req: any, res) => {
    const type = clean(req.body.type || 'group');
    let memberIds = Array.from(new Set<string>([req.user.id, ...(req.body.memberIds || [])]));
    if (!['direct', 'group', 'company'].includes(type)) return res.status(400).json({ error: 'Tipo de canal invalido' });
    if (type !== 'direct' && !isAdmin(req.user)) return res.status(403).json({ error: 'Apenas administradores criam canais' });
    if (type === 'direct' && memberIds.length !== 2) return res.status(400).json({ error: 'Conversa direta exige dois participantes' });
    if (type === 'company' && req.body.isPrivate === false) {
      memberIds = (db.prepare('SELECT id FROM users WHERE tenant_id = ?').all(req.user.tenantId) as any[]).map(user => user.id);
    }
    const validMembers = db.prepare(`SELECT id, name FROM users WHERE tenant_id = ? AND id IN (${memberIds.map(() => '?').join(',')})`).all(req.user.tenantId, ...memberIds) as any[];
    if (validMembers.length !== memberIds.length) return res.status(400).json({ error: 'Participante invalido' });
    if (type === 'direct') {
      const existing = db.prepare(`SELECT c.* FROM internal_channels c WHERE c.tenant_id = ? AND c.type = 'direct' AND (SELECT COUNT(*) FROM internal_channel_members WHERE channel_id = c.id) = 2 AND EXISTS (SELECT 1 FROM internal_channel_members WHERE channel_id = c.id AND user_id = ?) AND EXISTS (SELECT 1 FROM internal_channel_members WHERE channel_id = c.id AND user_id = ?)`).get(req.user.tenantId, memberIds[0], memberIds[1]) as any;
      if (existing) return res.json(formatChannel(existing));
    }
    const channelId = id(); const name = clean(req.body.name) || validMembers.filter(item => item.id !== req.user.id).map(item => item.name).join(', ');
    db.prepare(`INSERT INTO internal_channels (id, tenant_id, name, description, type, created_by, is_private) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(channelId, req.user.tenantId, name || 'Conversa interna', clean(req.body.description) || null, type, req.user.id, req.body.isPrivate === false ? 0 : 1);
    const insertMember = db.prepare('INSERT INTO internal_channel_members (id, channel_id, user_id, role) VALUES (?, ?, ?, ?)');
    memberIds.forEach(memberId => insertMember.run(id(), channelId, memberId, memberId === req.user.id ? 'owner' : 'member'));
    audit(db, req.user, 'internal_channel.created', 'internal_channels', channelId, null, { type, memberIds }); await commit();
    res.status(201).json(formatChannel(db.prepare('SELECT * FROM internal_channels WHERE id = ?').get(channelId)));
  });

  app.get('/api/internal/channels/:channelId/messages', authenticate, (req: any, res) => {
    if (!channelForUser(db, req.user, req.params.channelId)) return res.status(404).json({ error: 'Canal nao encontrado ou sem permissao' });
    const rows = db.prepare(`SELECT im.*, u.name sender_name, EXISTS(SELECT 1 FROM internal_message_mentions mm WHERE mm.message_id = im.id AND mm.mentioned_user_id = ?) mentioned_me FROM internal_messages im JOIN users u ON u.id = im.sender_id WHERE im.channel_id = ? AND im.tenant_id = ? AND im.deleted_at IS NULL ORDER BY im.created_at, im.rowid`).all(req.user.id, req.params.channelId, req.user.tenantId);
    res.json(rows);
  });

  app.post('/api/internal/channels/:channelId/messages', authenticate, async (req: any, res) => {
    const channel = channelForUser(db, req.user, req.params.channelId);
    if (!channel) return res.status(404).json({ error: 'Canal nao encontrado ou sem permissao' });
    const text = clean(req.body.text); if (!text) return res.status(400).json({ error: 'Mensagem vazia' });
    const messageId = id(); db.prepare(`INSERT INTO internal_messages (id, tenant_id, channel_id, sender_id, text, reply_to_message_id, created_at) VALUES (?, ?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%f', 'now'))`).run(messageId, req.user.tenantId, channel.id, req.user.id, text, req.body.replyToMessageId || null);
    const users = db.prepare('SELECT id, name FROM users WHERE tenant_id = ?').all(req.user.tenantId) as any[];
    const lowered = text.toLowerCase();
    users.filter(user => lowered.includes(`@${user.name.toLowerCase()}`) || lowered.includes(`@${user.name.toLowerCase().replace(/\s+/g, '.')}`)).forEach(user => db.prepare('INSERT OR IGNORE INTO internal_message_mentions (id, message_id, mentioned_user_id) VALUES (?, ?, ?)').run(id(), messageId, user.id));
    db.prepare('UPDATE internal_channels SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(channel.id);
    db.prepare("UPDATE internal_channel_members SET last_read_at = strftime('%Y-%m-%d %H:%M:%f', 'now') WHERE channel_id = ? AND user_id = ?").run(channel.id, req.user.id);
    await commit(); res.status(201).json(db.prepare(`SELECT im.*, u.name sender_name FROM internal_messages im JOIN users u ON u.id = im.sender_id WHERE im.id = ?`).get(messageId));
  });

  app.post('/api/internal/channels/:channelId/read', authenticate, async (req: any, res) => {
    if (!channelForUser(db, req.user, req.params.channelId)) return res.status(404).json({ error: 'Canal nao encontrado' });
    db.prepare("UPDATE internal_channel_members SET last_read_at = strftime('%Y-%m-%d %H:%M:%f', 'now') WHERE channel_id = ? AND user_id = ?").run(req.params.channelId, req.user.id);
    db.prepare(`UPDATE internal_message_mentions SET read_at = CURRENT_TIMESTAMP WHERE mentioned_user_id = ? AND message_id IN (SELECT id FROM internal_messages WHERE channel_id = ?)`).run(req.user.id, req.params.channelId);
    await commit(); res.json({ success: true });
  });

  app.post('/api/internal/channels/:channelId/members', authenticate, async (req: any, res) => {
    const channel = db.prepare('SELECT * FROM internal_channels WHERE id = ? AND tenant_id = ?').get(req.params.channelId, req.user.tenantId) as any;
    if (!channel || !isAdmin(req.user)) return res.status(403).json({ error: 'Sem permissao para gerenciar membros' });
    const user = db.prepare('SELECT id FROM users WHERE id = ? AND tenant_id = ?').get(req.body.userId, req.user.tenantId);
    if (!user) return res.status(400).json({ error: 'Usuario invalido' });
    db.prepare('INSERT OR IGNORE INTO internal_channel_members (id, channel_id, user_id, role) VALUES (?, ?, ?, ?)').run(id(), channel.id, req.body.userId, 'member');
    audit(db, req.user, 'internal_channel.member_added', 'internal_channels', channel.id, null, { userId: req.body.userId }); await commit(); res.status(201).json({ success: true });
  });

  app.get('/api/internal/channels/:channelId/members', authenticate, (req: any, res) => {
    if (!channelForUser(db, req.user, req.params.channelId)) return res.status(404).json({ error: 'Canal nao encontrado' });
    res.json(db.prepare(`SELECT u.id, u.name, u.email, u.role, m.role member_role, m.joined_at, m.last_read_at FROM internal_channel_members m JOIN users u ON u.id = m.user_id WHERE m.channel_id = ? AND u.tenant_id = ? ORDER BY u.name`).all(req.params.channelId, req.user.tenantId));
  });

  app.delete('/api/internal/channels/:channelId/members/:userId', authenticate, async (req: any, res) => {
    const channel = db.prepare('SELECT * FROM internal_channels WHERE id = ? AND tenant_id = ?').get(req.params.channelId, req.user.tenantId) as any;
    if (!channel || !isAdmin(req.user)) return res.status(403).json({ error: 'Sem permissao para gerenciar membros' });
    db.prepare('DELETE FROM internal_channel_members WHERE channel_id = ? AND user_id = ?').run(channel.id, req.params.userId);
    audit(db, req.user, 'internal_channel.member_removed', 'internal_channels', channel.id, { userId: req.params.userId }, null); await commit(); res.json({ success: true });
  });

  app.get('/api/leads/:leadId/internal-channel', authenticate, async (req: any, res) => {
    const lead = canAccessLead(db, req.user, req.params.leadId); if (!lead) return res.status(404).json({ error: 'Lead nao encontrado ou sem permissao' });
    let channel = db.prepare(`SELECT * FROM internal_channels WHERE tenant_id = ? AND lead_id = ? AND type = 'lead'`).get(req.user.tenantId, lead.id) as any;
    if (!channel) {
      const channelId = id(); db.prepare(`INSERT INTO internal_channels (id, tenant_id, name, description, type, lead_id, created_by, is_private) VALUES (?, ?, ?, ?, 'lead', ?, ?, 1)`).run(channelId, req.user.tenantId, `Lead: ${lead.name}`, 'Discussao interna vinculada ao lead', lead.id, req.user.id);
      db.prepare('INSERT INTO internal_channel_members (id, channel_id, user_id, role) VALUES (?, ?, ?, ?)').run(id(), channelId, req.user.id, 'owner'); channel = db.prepare('SELECT * FROM internal_channels WHERE id = ?').get(channelId); await commit();
    } else {
      db.prepare('INSERT OR IGNORE INTO internal_channel_members (id, channel_id, user_id, role) VALUES (?, ?, ?, ?)').run(id(), channel.id, req.user.id, 'member'); await commit();
    }
    res.json(formatChannel(channel));
  });

  app.post('/api/internal/channels/:channelId/service-record', authenticate, async (req: any, res) => {
    const channel = channelForUser(db, req.user, req.params.channelId);
    if (!channel || channel.type !== 'lead' || !channel.lead_id || !canAccessLead(db, req.user, channel.lead_id)) return res.status(404).json({ error: 'Discussao vinculada ao lead nao encontrada' });
    if (!clean(req.body.summary)) return res.status(400).json({ error: 'Resumo da decisao e obrigatorio' });
    const conversation = db.prepare('SELECT id FROM conversations WHERE tenant_id = ? AND lead_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.tenantId, channel.lead_id) as any;
    const recordId = id(); db.prepare(`INSERT INTO lead_service_records (id, tenant_id, lead_id, conversation_id, attendant_id, source, channel, started_at, ended_at, message_count, summary, decisions_json, pending_items_json, next_action, next_action_due_at, reviewed_by, reviewed_at) VALUES (?, ?, ?, ?, ?, 'internal_chat', 'interno', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
      .run(recordId, req.user.tenantId, channel.lead_id, conversation?.id || null, req.user.id, clean(req.body.summary), JSON.stringify(req.body.decisions || []), JSON.stringify(req.body.pendingItems || []), clean(req.body.nextAction) || null, req.body.nextActionDueAt || null, req.user.id);
    audit(db, req.user, 'internal_decision.registered', 'lead_service_records', recordId, null, { channelId: channel.id, leadId: channel.lead_id }); await commit(); res.status(201).json(formatRecord(db.prepare('SELECT * FROM lead_service_records WHERE id = ?').get(recordId)));
  });

  app.get('/api/leads/import/template', authenticate, (req: any, res) => {
    if (!canImportLeads(req.user)) return res.status(403).json({ error: 'Sem permissao para importar leads' });
    const csv = `${templateColumns.join(';')}\r\n${['Nome obrigatorio', '5511999999999', 'email@exemplo.com', 'Empresa', 'Indicacao', '', '', '', 'vip, retorno', ''].map(csvCell).join(';')}\r\n`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', 'attachment; filename="modelo-importacao-leads.csv"'); res.send(`\uFEFF${csv}`);
  });

  app.post('/api/leads/import/preview', authenticate, upload.single('file'), (req: any, res) => {
    try {
      if (!canImportLeads(req.user)) return res.status(403).json({ error: 'Sem permissao para importar leads' });
      if (!req.file) return res.status(400).json({ error: 'Arquivo nao informado' });
      const validated = validateImportRows(db, req.user.tenantId, parseImportFile(req.file));
      res.json({ fileName: req.file.originalname, totalRows: validated.length, validRows: validated.filter(row => !row.errors.length).length, errorRows: validated.filter(row => row.errors.length).length, duplicateRows: validated.filter(row => row.duplicate).length, rows: validated });
    } catch (error: any) { res.status(error.status || 400).json({ error: error.message }); }
  });

  app.post('/api/leads/import/execute', authenticate, async (req: any, res) => {
    if (!canImportLeads(req.user)) return res.status(403).json({ error: 'Sem permissao para importar leads' });
    const incoming = Array.isArray(req.body.rows) ? req.body.rows : [];
    if (!incoming.length) return res.status(400).json({ error: 'Previa vazia ou invalida' });
    const duplicateMode = ['ignore', 'update', 'create'].includes(req.body.duplicateMode) ? req.body.duplicateMode : 'ignore';
    const revalidated = validateImportRows(db, req.user.tenantId, incoming.map((row: any) => row.raw || row));
    const batchId = id(); db.prepare(`INSERT INTO lead_import_batches (id, tenant_id, file_name, status, total_rows, created_by, settings_json) VALUES (?, ?, ?, 'processing', ?, ?, ?)`).run(batchId, req.user.tenantId, clean(req.body.fileName) || 'importacao', revalidated.length, req.user.id, JSON.stringify({ duplicateMode }));
    let imported = 0, duplicates = 0, errors = 0;
    const insertRow = db.prepare(`INSERT INTO lead_import_rows (id, batch_id, row_number, raw_data_json, normalized_data_json, status, lead_id, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    const tx = db.transaction(() => {
      for (const row of revalidated) {
        let status = 'error', leadId: string | null = null, error = row.errors.join('; ');
        if (row.errors.length) errors++;
        else if (row.duplicate && (duplicateMode === 'ignore' || (row.duplicate.source === 'file' && duplicateMode === 'update'))) { status = 'duplicate'; leadId = row.duplicate.id; duplicates++; error = 'Duplicidade ignorada'; }
        else if (row.duplicate && duplicateMode === 'update') {
          leadId = row.duplicate.id; status = 'updated'; db.prepare(`UPDATE leads SET name = ?, phone = ?, email = ?, company = ?, source = ?, assigned_to = COALESCE(?, assigned_to), stage_id = ?, pipeline_id = ?, tags = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`).run(row.data.name, row.data.phone, row.data.email || null, row.data.company || null, row.data.source, row.data.responsibleId, row.data.stageId, row.data.pipelineId, JSON.stringify(row.data.tags), row.data.notes, leadId, req.user.tenantId); imported++;
        } else {
          leadId = id(); status = 'imported'; db.prepare(`INSERT INTO leads (id, tenant_id, name, phone, email, company, source, source_type, stage_id, pipeline_id, assigned_to, owner_user_id, tags, notes) VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?, ?, ?, ?, ?)`).run(leadId, req.user.tenantId, row.data.name, row.data.phone, row.data.email || null, row.data.company || null, row.data.source, row.data.stageId, row.data.pipelineId, row.data.responsibleId, req.user.id, JSON.stringify(row.data.tags), row.data.notes);
          db.prepare(`INSERT INTO conversations (id, tenant_id, lead_id, assigned_to, status) VALUES (?, ?, ?, ?, ?)`).run(id(), req.user.tenantId, leadId, row.data.responsibleId, row.data.responsibleId ? 'assigned' : 'unassigned');
          db.prepare(`INSERT INTO lead_source_history (id, tenant_id, lead_id, source, source_type) VALUES (?, ?, ?, ?, 'manual')`).run(id(), req.user.tenantId, leadId, row.data.source); imported++;
        }
        insertRow.run(id(), batchId, row.rowNumber, JSON.stringify(row.raw), JSON.stringify(row.data), status, leadId, error || null);
      }
      db.prepare(`UPDATE lead_import_batches SET status = 'completed', imported_rows = ?, duplicate_rows = ?, error_rows = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(imported, duplicates, errors, batchId);
      audit(db, req.user, 'lead_import.completed', 'lead_import_batches', batchId, null, { imported, duplicates, errors });
    });
    tx(); await commit(); res.status(201).json({ batchId, totalRows: revalidated.length, importedRows: imported, duplicateRows: duplicates, errorRows: errors, status: 'completed' });
  });

  app.get('/api/leads/imports', authenticate, (req: any, res) => {
    if (!canImportLeads(req.user)) return res.status(403).json({ error: 'Sem permissao' });
    res.json(isAdmin(req.user)
      ? db.prepare(`SELECT b.*, u.name created_by_name FROM lead_import_batches b LEFT JOIN users u ON u.id = b.created_by WHERE b.tenant_id = ? ORDER BY b.created_at DESC`).all(req.user.tenantId)
      : db.prepare(`SELECT b.*, u.name created_by_name FROM lead_import_batches b LEFT JOIN users u ON u.id = b.created_by WHERE b.tenant_id = ? AND b.created_by = ? ORDER BY b.created_at DESC`).all(req.user.tenantId, req.user.id));
  });
  app.get('/api/leads/imports/:batchId', authenticate, (req: any, res) => {
    if (!canImportLeads(req.user)) return res.status(403).json({ error: 'Sem permissao' });
    const batch = db.prepare('SELECT * FROM lead_import_batches WHERE id = ? AND tenant_id = ?').get(req.params.batchId, req.user.tenantId) as any;
    if (!batch || (!isAdmin(req.user) && batch.created_by !== req.user.id)) return res.status(404).json({ error: 'Lote nao encontrado' });
    res.json({ ...batch, rows: db.prepare('SELECT * FROM lead_import_rows WHERE batch_id = ? ORDER BY row_number').all(batch.id) });
  });
  app.get('/api/leads/imports/:batchId/errors', authenticate, (req: any, res) => {
    if (!canImportLeads(req.user)) return res.status(403).json({ error: 'Sem permissao' });
    const batch = db.prepare('SELECT * FROM lead_import_batches WHERE id = ? AND tenant_id = ?').get(req.params.batchId, req.user.tenantId) as any;
    if (!batch || (!isAdmin(req.user) && batch.created_by !== req.user.id)) return res.status(404).json({ error: 'Lote nao encontrado' });
    const rows = db.prepare(`SELECT row_number, raw_data_json, error_message FROM lead_import_rows WHERE batch_id = ? AND status IN ('error','duplicate') ORDER BY row_number`).all(batch.id) as any[];
    if (!rows.length) return res.status(204).send();
    const csv = ['linha;dados;motivo', ...rows.map(row => [row.row_number, json(row.raw_data_json, {}), row.error_message].map(csvCell).join(';'))].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="erros-importacao-${batch.id}.csv"`); res.send(`\uFEFF${csv}`);
  });
}
