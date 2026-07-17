import express from 'express';
import path from 'path';
import cors from 'cors';
import db, { ensureDatabaseReady, markDatabaseDirty, persistDatabaseIfNeeded } from './src/db/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Prefer .env.local for local development, then fall back to .env.
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const app = express();
const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

app.use(cors());
app.use(express.json({
  limit: '50mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));

app.use('/api', async (_req, _res, next) => {
  try {
    await ensureDatabaseReady();
    next();
  } catch (error) {
    next(error);
  }
});

async function commitDbChanges() {
  markDatabaseDirty();
  await persistDatabaseIfNeeded();
}

// API Routes

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SaaS CRM Backend is running' });
});

app.post('/api/public/leads', async (req: any, res: any) => {
  const captureToken = req.headers['x-capture-token'] || req.body.token;
  const { name, phone, email, company, source = 'site', campaign, page } = req.body;
  if (!captureToken) return res.status(401).json({ error: 'Token de captura não informado' });
  if (!name?.trim() || (!phone?.trim() && !email?.trim())) {
    return res.status(400).json({ error: 'Nome e telefone ou e-mail são obrigatórios' });
  }

  const settings = db.prepare('SELECT tenant_id FROM tenant_settings WHERE lead_capture_token = ?').get(captureToken) as any;
  if (!settings) return res.status(401).json({ error: 'Token de captura inválido' });
  const tenantId = settings.tenant_id;
  const normalizedSource = String(source).toLowerCase() === 'formulario' ? 'formulario' : 'site';
  let lead = phone?.trim()
    ? db.prepare('SELECT * FROM leads WHERE tenant_id = ? AND phone = ?').get(tenantId, phone.trim()) as any
    : null;
  if (!lead && email?.trim()) {
    lead = db.prepare('SELECT * FROM leads WHERE tenant_id = ? AND lower(email) = lower(?)').get(tenantId, email.trim()) as any;
  }

  const leadId = lead?.id || crypto.randomUUID();
  if (lead) {
    db.prepare(`UPDATE leads SET name = ?, phone = COALESCE(?, phone), email = COALESCE(?, email), company = COALESCE(?, company), source = ?, source_type = 'automatic', source_campaign = ?, source_page = ?, source_captured_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`)
      .run(name.trim(), phone?.trim() || null, email?.trim() || null, company || null, normalizedSource, campaign || null, page || null, leadId, tenantId);
  } else {
    const pipeline = db.prepare('SELECT id FROM pipelines WHERE tenant_id = ? ORDER BY created_at LIMIT 1').get(tenantId) as any;
    const stage = pipeline ? db.prepare('SELECT id FROM pipeline_stages WHERE pipeline_id = ? ORDER BY "order" LIMIT 1').get(pipeline.id) as any : null;
    if (!pipeline || !stage) return res.status(409).json({ error: 'O cliente não possui funil configurado' });
    db.prepare(`INSERT INTO leads (id, tenant_id, name, phone, email, company, source, source_type, source_campaign, source_page, source_captured_at, stage_id, pipeline_id, tags) VALUES (?, ?, ?, ?, ?, ?, ?, 'automatic', ?, ?, CURRENT_TIMESTAMP, ?, ?, '[]')`)
      .run(leadId, tenantId, name.trim(), phone?.trim() || '', email?.trim() || null, company || null, normalizedSource, campaign || null, page || null, stage.id, pipeline.id);
    db.prepare("INSERT INTO conversations (id, tenant_id, lead_id, status) VALUES (?, ?, ?, 'unassigned')").run(crypto.randomUUID(), tenantId, leadId);
  }
  db.prepare('INSERT INTO lead_source_history (id, tenant_id, lead_id, source, source_type, campaign, source_page) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), tenantId, leadId, normalizedSource, 'automatic', campaign || null, page || null);
  await commitDbChanges();
  res.status(lead ? 200 : 201).json({ id: leadId, created: !lead });
});

// Middleware to protect routes
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verify user still exists in database
    const user = db.prepare('SELECT id, role, tenant_id FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    
    req.user = { id: user.id, role: user.role, tenantId: user.tenant_id };
    
    // Master impersonation logic: if master provides a tenant ID header, use it
    if (req.user.role === 'master' && req.headers['x-tenant-id']) {
      const selectedTenant = db.prepare('SELECT id FROM tenants WHERE id = ?').get(req.headers['x-tenant-id']);
      if (!selectedTenant) return res.status(403).json({ error: 'Cliente ativo inválido' });
      req.user.tenantId = req.headers['x-tenant-id'];
    }
    
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Dashboard Endpoints
app.get('/api/dashboard/master', authenticate, (req: any, res: any) => {
  if (req.user.role !== 'master') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const totalTenants = db.prepare('SELECT COUNT(*) as count FROM tenants').get() as any;
    const activeTenants = db.prepare("SELECT COUNT(*) as count FROM tenants WHERE status != 'suspended'").get() as any;
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get() as any;
    const totalConversations = db.prepare('SELECT COUNT(*) as count FROM conversations').get() as any;
    const totalMessages = db.prepare('SELECT COUNT(*) as count FROM messages').get() as any;
    const sentMessages = db.prepare("SELECT COUNT(*) as count FROM messages WHERE sender_type = 'user'").get() as any;
    const receivedMessages = db.prepare("SELECT COUNT(*) as count FROM messages WHERE sender_type = 'lead'").get() as any;
    
    // AI Stats
    const totalAiTokens = db.prepare('SELECT COALESCE(SUM(total_tokens), 0) as total FROM ai_usage_logs').get() as any;
    const totalAiCalls = db.prepare('SELECT COUNT(*) as count FROM ai_usage_logs').get() as any;

    const clientsUsage = db.prepare(`
      SELECT 
        t.name, 
        COUNT(l.id) as leads_count,
        (SELECT COUNT(*) FROM conversations c WHERE c.tenant_id = t.id) as conv_count,
        (SELECT COALESCE(SUM(total_tokens), 0) FROM ai_usage_logs ai WHERE ai.tenant_id = t.id) as ai_tokens
      FROM tenants t
      LEFT JOIN leads l ON l.tenant_id = t.id
      GROUP BY t.id
      ORDER BY leads_count DESC
      LIMIT 10
    `).all();

    res.json({
      totalTenants: totalTenants.count,
      activeTenants: activeTenants.count,
      totalUsers: totalUsers.count,
      totalLeads: totalLeads.count,
      totalConversations: totalConversations.count,
      totalMessages: totalMessages.count,
      sentMessages: sentMessages.count,
      receivedMessages: receivedMessages.count,
      totalAiTokens: totalAiTokens.total,
      totalAiCalls: totalAiCalls.count,
      clientsUsage
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});



app.get('/api/knowledge-bases', authenticate, (req: any, res: any) => {
  const { tenantId } = req.user;
  const bases = db.prepare('SELECT * FROM knowledge_bases WHERE tenant_id = ?').all(tenantId);
  res.json(bases);
});

app.post('/api/knowledge-bases', authenticate, async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  
  const newId = Math.random().toString(36).substring(2, 9);
  db.prepare('INSERT INTO knowledge_bases (id, tenant_id, name, description) VALUES (?, ?, ?, ?)').run(
    newId, tenantId, name, description || ''
  );
  
  db.prepare('INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)').run(
    Math.random().toString(36).substring(2, 9), tenantId, req.user.id, 'Base Criada', 'knowledge_bases', newId
  );
  
  await commitDbChanges();
  res.json({ id: newId });
});

app.get('/api/users', authenticate, (req: any, res: any) => {
  const { tenantId, role } = req.user;
  
  if (role === 'master') {
    const users = db.prepare('SELECT id, name, email, role, tenant_id FROM users').all();
    return res.json(users);
  }
  
  const users = db.prepare('SELECT id, name, email, role FROM users WHERE tenant_id = ?').all(tenantId);
  res.json(users);
});

app.post('/api/users', authenticate, async (req: any, res: any) => {
  const { tenantId, role } = req.user;
  if (role !== 'admin' && role !== 'master') {
    return res.status(403).json({ error: 'Não autorizado' });
  }

  const { name, email, password, role: newRole } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Dados inválidos' });
  
  try {
    const hash = bcrypt.hashSync(password, 10);
    const newId = Math.random().toString(36).substring(2, 9);
    
    db.prepare('INSERT INTO users (id, tenant_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)').run(
      newId, tenantId, name, email, hash, newRole === 'admin' ? 'admin' : 'user'
    );
    
    db.prepare('INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)').run(
      Math.random().toString(36).substring(2, 9), tenantId, req.user.id, 'Usuário Criado', 'users', newId
    );
    
    await commitDbChanges();
    res.json({ success: true, id: newId });
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'E-mail já cadastrado' });
    } else {
      res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  }
});

app.get('/api/dashboard/tenant', authenticate, (req: any, res: any) => {
  const { tenantId, role, id: userId } = req.user;

  try {
    let leadFilter = "tenant_id = ?";
    let convFilter = "tenant_id = ?";
    const params: any[] = [tenantId];

    if (role !== 'admin' && role !== 'master') {
      leadFilter = "tenant_id = ? AND (assigned_to = ? OR owner_user_id = ?)";
      convFilter = "tenant_id = ? AND assigned_to = ?";
      params.push(userId, userId);
    }

    const leadsQuery = `SELECT status, COUNT(*) as count FROM leads WHERE ${leadFilter} GROUP BY status`;
    let leadParams = [...params];
    if (role !== 'admin' && role !== 'master') leadParams = [tenantId, userId, userId];
    else leadParams = [tenantId];
    
    const leadsByStatus = db.prepare(leadsQuery).all(...leadParams) as any[];

    const totalLeads = leadsByStatus.reduce((acc, curr) => acc + curr.count, 0);
    const wonLeads = leadsByStatus.find(s => s.status === 'won')?.count || 0;
    const lostLeads = leadsByStatus.find(s => s.status === 'lost')?.count || 0;
    const activeLeads = totalLeads - wonLeads - lostLeads;

    let cParams = [...params];
    if (role !== 'admin' && role !== 'master') cParams = [tenantId, userId];
    else cParams = [tenantId];

    const convQuery = `SELECT status, COUNT(*) as count FROM conversations WHERE ${convFilter} GROUP BY status`;
    const convByStatus = db.prepare(convQuery).all(...cParams) as any[];

    const totalConversations = convByStatus.reduce((acc, curr) => acc + curr.count, 0);
    const openConversations = convByStatus.filter(s => s.status !== 'closed').reduce((acc, curr) => acc + curr.count, 0);
    const waitingConversations = convByStatus.find(s => s.status === 'waiting_client')?.count || 0;
    const closedConversations = convByStatus.find(s => s.status === 'closed')?.count || 0;

    let mParams = [...cParams];
    const messagesQuery = `
      SELECT sender_type, COUNT(*) as count 
      FROM messages m 
      JOIN conversations c ON m.conversation_id = c.id 
      WHERE c.${convFilter} 
      GROUP BY sender_type
    `;
    const msgBySender = db.prepare(messagesQuery).all(...mParams) as any[];
    
    const sentMessages = msgBySender.find(s => s.sender_type === 'user')?.count || 0;
    const receivedMessages = msgBySender.find(s => s.sender_type === 'lead')?.count || 0;

    // AI usage for tenant
    let aiParams = [tenantId];
    let aiFilter = "tenant_id = ?";
    if (role !== 'admin' && role !== 'master') {
      aiFilter = "tenant_id = ? AND user_id = ?";
      aiParams.push(userId);
    }
    const aiUsageQuery = `SELECT action, COUNT(*) as count, COALESCE(SUM(total_tokens), 0) as tokens FROM ai_usage_logs WHERE ${aiFilter} GROUP BY action`;
    const aiUsageByAction = db.prepare(aiUsageQuery).all(...aiParams) as any[];
    
    const totalAiTokens = aiUsageByAction.reduce((acc, curr) => acc + curr.tokens, 0);
    const totalAiCalls = aiUsageByAction.reduce((acc, curr) => acc + curr.count, 0);

    // Leads by stage (Pipeline)
    const leadsByStageQuery = `
      SELECT s.name as stage_name, COUNT(l.id) as count 
      FROM pipeline_stages s
      JOIN pipelines p ON s.pipeline_id = p.id
      LEFT JOIN leads l ON l.stage_id = s.id AND ${leadFilter.replace('tenant_id', 'l.tenant_id')}
      WHERE p.tenant_id = ?
      GROUP BY s.id
      ORDER BY s."order" ASC
    `;
    let stageParams = [tenantId, ...leadParams];
    const leadsByStage = db.prepare(leadsByStageQuery).all(...stageParams) as any[];

    res.json({
      totalLeads, activeLeads, wonLeads, lostLeads,
      totalConversations, openConversations, waitingConversations, closedConversations,
      sentMessages, receivedMessages,
      totalAiTokens, totalAiCalls,
      leadsByStage,
      aiUsageByAction
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  
  // For MVP we allow login if password matches 'password' or the real hash
  if (!user) return res.status(401).json({ error: 'User not found' });
  
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, role: user.role, tenantId: user.tenant_id }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenant_id } });
});

// Tenants (Master only)
app.get('/api/admin/tenants', authenticate, (req: any, res: any) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: 'Forbidden' });
  
  const tenants = db.prepare(`
    SELECT t.*, ts.company_name, ts.logo_url, ts.primary_color, ts.sidebar_color, ts.sidebar_text_color 
    FROM tenants t 
    LEFT JOIN tenant_settings ts ON t.id = ts.tenant_id
  `).all();
  
  res.json(tenants.map((t: any) => ({
    id: t.id,
    name: t.name,
    status: t.status,
    createdAt: t.created_at,
    settings: {
      companyName: t.company_name,
      logoUrl: t.logo_url,
      primaryColor: t.primary_color,
      sidebarColor: t.sidebar_color,
      sidebarTextColor: t.sidebar_text_color
    }
  })));
});

app.post('/api/admin/tenants', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: 'Forbidden' });
  
  const { name, company_name, email, admin_name, admin_email, admin_password } = req.body;
  
  try {
    const tenantId = Math.random().toString(36).substring(2, 9);
    const userId = Math.random().toString(36).substring(2, 9);
    const hash = bcrypt.hashSync(admin_password || 'password', 10);
    const pipelineId = Math.random().toString(36).substring(2, 9);
    
    db.prepare('BEGIN').run();
    db.prepare('INSERT INTO tenants (id, name, email) VALUES (?, ?, ?)').run(tenantId, name, email);
    db.prepare('INSERT INTO tenant_settings (tenant_id, company_name, lead_capture_token) VALUES (?, ?, lower(hex(randomblob(24))))').run(tenantId, company_name || name);
    db.prepare('INSERT INTO users (id, tenant_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)').run(userId, tenantId, admin_name, admin_email, hash, 'admin');
    
    // Create default pipeline and stages
    db.prepare('INSERT INTO pipelines (id, tenant_id, name) VALUES (?, ?, ?)').run(pipelineId, tenantId, 'Funil de Vendas');
    db.prepare('INSERT INTO pipeline_stages (id, pipeline_id, name, "order") VALUES (?, ?, ?, ?)').run(Math.random().toString(36).substring(2, 9), pipelineId, 'Novo Lead', 0);
    db.prepare('INSERT INTO pipeline_stages (id, pipeline_id, name, "order") VALUES (?, ?, ?, ?)').run(Math.random().toString(36).substring(2, 9), pipelineId, 'Em Atendimento', 1);
    db.prepare('INSERT INTO pipeline_stages (id, pipeline_id, name, "order") VALUES (?, ?, ?, ?)').run(Math.random().toString(36).substring(2, 9), pipelineId, 'Fechamento', 2);
    
    db.prepare('COMMIT').run();
    
    await commitDbChanges();
    res.json({ success: true, tenantId });
  } catch (err: any) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: err.message });
  }
});

function normalizeTenantSettings(settings: any, fallbackCompanyName = 'CRM Flow') {
  return {
    company_name: settings?.company_name || fallbackCompanyName,
    logo_url: settings?.logo_url || '',
    primary_color: settings?.primary_color || '#4f46e5',
    sidebar_color: settings?.sidebar_color || '#0F172A',
    sidebar_text_color: settings?.sidebar_text_color || '#cbd5e1',
  };
}

// Tenant Details and Settings
app.get('/api/tenant/settings', authenticate, async (req: any, res: any) => {
  const { tenantId, role } = req.user;
  if (role === 'master' && !tenantId) {
    return res.json(normalizeTenantSettings({ company_name: 'Master Panel' }, 'Master Panel'));
  }
  
  const tenant = db.prepare('SELECT name FROM tenants WHERE id = ?').get(tenantId) as any;
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  let settings = db.prepare('SELECT * FROM tenant_settings WHERE tenant_id = ?').get(tenantId) as any;

  if (!settings) {
    db.prepare(`
      INSERT INTO tenant_settings (tenant_id, company_name, primary_color, logo_url, sidebar_color, sidebar_text_color, lead_capture_token)
      VALUES (?, ?, ?, ?, ?, ?, lower(hex(randomblob(24))))
    `).run(
      tenantId,
      tenant.name,
      '#4f46e5',
      '',
      '#0F172A',
      '#cbd5e1'
    );
    await commitDbChanges();
    settings = db.prepare('SELECT * FROM tenant_settings WHERE tenant_id = ?').get(tenantId) as any;
  }

  res.json(normalizeTenantSettings(settings, tenant.name));
});

app.patch('/api/tenant/settings', authenticate, async (req: any, res: any) => {
  const { tenantId, role } = req.user;
  if (role !== 'admin' && role !== 'master') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const { company_name, primary_color, logo_url, sidebar_color, sidebar_text_color } = req.body;
    const tenant = db.prepare('SELECT name FROM tenants WHERE id = ?').get(tenantId) as any;
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const normalized = normalizeTenantSettings(
      { company_name, primary_color, logo_url, sidebar_color, sidebar_text_color },
      tenant.name
    );

    db.prepare(`
      INSERT INTO tenant_settings (tenant_id, company_name, primary_color, logo_url, sidebar_color, sidebar_text_color, lead_capture_token)
      VALUES (?, ?, ?, ?, ?, ?, lower(hex(randomblob(24))))
      ON CONFLICT(tenant_id) DO UPDATE SET
        company_name = excluded.company_name,
        primary_color = excluded.primary_color,
        logo_url = excluded.logo_url,
        sidebar_color = excluded.sidebar_color,
        sidebar_text_color = excluded.sidebar_text_color
    `).run(
      tenantId,
      normalized.company_name,
      normalized.primary_color,
      normalized.logo_url,
      normalized.sidebar_color,
      normalized.sidebar_text_color
    );
    await commitDbChanges();
    const savedSettings = db.prepare('SELECT * FROM tenant_settings WHERE tenant_id = ?').get(tenantId) as any;
    res.json(normalizeTenantSettings(savedSettings, tenant.name));
  } catch (error: any) {
    console.error('Error updating tenant settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pipelines and Stages
app.get('/api/pipelines', authenticate, (req: any, res: any) => {
  try {
    const { tenantId } = req.user;
    if (!tenantId) {
      return res.json([]);
    }

    const pipelines = db.prepare('SELECT * FROM pipelines WHERE tenant_id = ?').all(tenantId);
    const stages = db.prepare('SELECT ps.* FROM pipeline_stages ps JOIN pipelines p ON ps.pipeline_id = p.id WHERE p.tenant_id = ? ORDER BY ps."order"').all(tenantId);

    const pipelinesWithStages = pipelines.map((p: any) => ({
      id: p.id,
      tenantId: p.tenant_id,
      name: p.name,
      createdAt: p.created_at,
      stages: stages.filter((s: any) => s.pipeline_id === p.id).map((s: any) => ({
        id: s.id,
        pipelineId: s.pipeline_id,
        name: s.name,
        order: s.order
      }))
    }));

    res.json(pipelinesWithStages);
  } catch (err: any) {
    console.error('Error loading pipelines:', err);
    res.status(500).json({ error: 'Falha ao carregar pipelines', details: err.message });
  }
});

// Tags
app.get('/api/tags', authenticate, (req: any, res: any) => {
  const { tenantId } = req.user;
  const tags = db.prepare('SELECT * FROM tenant_tags WHERE tenant_id = ? ORDER BY created_at DESC').all(tenantId);
  res.json(tags.map((t: any) => ({
    id: t.id,
    tenantId: t.tenant_id,
    name: t.name,
    color: t.color,
    createdAt: t.created_at
  })));
});

app.post('/api/tags', authenticate, async (req: any, res: any) => {
  const { tenantId, role } = req.user;
  if (role !== 'admin' && role !== 'master') return res.status(403).json({ error: 'Forbidden' });
  
  const { name, color } = req.body;
  const id = Math.random().toString(36).substring(2, 9);
  
  db.prepare('INSERT INTO tenant_tags (id, tenant_id, name, color) VALUES (?, ?, ?, ?)').run(id, tenantId, name, color);
  
  const newTag = db.prepare('SELECT * FROM tenant_tags WHERE id = ?').get(id) as any;
  await commitDbChanges();
  res.json({
    id: newTag.id,
    tenantId: newTag.tenant_id,
    name: newTag.name,
    color: newTag.color,
    createdAt: newTag.created_at
  });
});

app.delete('/api/tags/:id', authenticate, async (req: any, res: any) => {
  const { tenantId, role } = req.user;
  if (role !== 'admin' && role !== 'master') return res.status(403).json({ error: 'Forbidden' });
  
  const { id } = req.params;
  db.prepare('DELETE FROM tenant_tags WHERE id = ? AND tenant_id = ?').run(id, tenantId);
  await commitDbChanges();
  res.json({ success: true });
});

// Quick Replies
app.get('/api/quick-replies', authenticate, (req: any, res: any) => {
  const { tenantId } = req.user;
  const replies = db.prepare('SELECT * FROM quick_replies WHERE tenant_id = ? ORDER BY created_at DESC').all(tenantId);
  res.json(replies.map((r: any) => ({
    id: r.id,
    tenantId: r.tenant_id,
    title: r.title,
    text: r.text,
    category: r.category || 'Geral',
    createdAt: r.created_at
  })));
});

app.post('/api/quick-replies', authenticate, async (req: any, res: any) => {
  const { tenantId, role } = req.user;
  
  const { title, text, category = 'Geral' } = req.body;
  if (!title?.trim() || !text?.trim()) return res.status(400).json({ error: 'Título e mensagem são obrigatórios' });
  const id = Math.random().toString(36).substring(2, 9);
  
  db.prepare('INSERT INTO quick_replies (id, tenant_id, title, text, category) VALUES (?, ?, ?, ?, ?)').run(id, tenantId, title.trim(), text.trim(), category.trim() || 'Geral');
  
  const newReply = db.prepare('SELECT * FROM quick_replies WHERE id = ?').get(id) as any;
  await commitDbChanges();
  res.json({
    id: newReply.id,
    tenantId: newReply.tenant_id,
    title: newReply.title,
    text: newReply.text,
    category: newReply.category || 'Geral',
    createdAt: newReply.created_at
  });
});

app.delete('/api/quick-replies/:id', authenticate, async (req: any, res: any) => {
  const { tenantId, role } = req.user;
  const { id } = req.params;
  db.prepare('DELETE FROM quick_replies WHERE id = ? AND tenant_id = ?').run(id, tenantId);
  await commitDbChanges();
  res.json({ success: true });
});

// Stages
app.post('/api/pipelines/:pipelineId/stages', authenticate, async (req: any, res: any) => {
  const { tenantId, role } = req.user;
  if (role !== 'admin' && role !== 'master') return res.status(403).json({ error: 'Forbidden' });
  
  const { pipelineId } = req.params;
  const { name, order } = req.body;
  const id = Math.random().toString(36).substring(2, 9);
  
  // Verify pipeline belongs to tenant
  const pipeline = db.prepare('SELECT * FROM pipelines WHERE id = ? AND tenant_id = ?').get(pipelineId, tenantId);
  if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
  
  db.prepare('INSERT INTO pipeline_stages (id, pipeline_id, name, "order") VALUES (?, ?, ?, ?)').run(id, pipelineId, name, order);
  
  await commitDbChanges();
  res.json({ success: true });
});

app.delete('/api/stages/:id', authenticate, async (req: any, res: any) => {
  const { tenantId, role } = req.user;
  if (role !== 'admin' && role !== 'master') return res.status(403).json({ error: 'Forbidden' });
  
  const { id } = req.params;
  
  // Ensure stage belongs to tenant
  const stage = db.prepare('SELECT ps.* FROM pipeline_stages ps JOIN pipelines p ON ps.pipeline_id = p.id WHERE ps.id = ? AND p.tenant_id = ?').get(id, tenantId);
  if (!stage) return res.status(404).json({ error: 'Stage not found' });
  
  db.prepare('DELETE FROM pipeline_stages WHERE id = ?').run(id);
  await commitDbChanges();
  res.json({ success: true });
});

// Leads
app.get('/api/leads', authenticate, (req: any, res: any) => {
  const { tenantId, role, id: userId } = req.user;
  
  let leads;
  if (role === 'admin' || role === 'master') {
    leads = db.prepare('SELECT * FROM leads WHERE tenant_id = ? ORDER BY created_at DESC').all(tenantId);
  } else {
    // User can only see leads assigned to them or where they are the owner
    leads = db.prepare(`
      SELECT DISTINCT l.* FROM leads l
      LEFT JOIN conversations c ON c.lead_id = l.id AND c.tenant_id = l.tenant_id
      WHERE l.tenant_id = ? AND (
        l.assigned_to = ? OR l.owner_user_id = ? OR c.assigned_to = ? OR
        c.assigned_to IS NULL OR c.status IN ('new', 'unassigned')
      )
      ORDER BY l.created_at DESC
    `).all(tenantId, userId, userId, userId);
  }
  
  res.json(leads.map((l: any) => ({
    ...l,
    tenantId: l.tenant_id,
    stageId: l.stage_id,
    pipelineId: l.pipeline_id,
    sourceType: l.source_type,
    sourceCampaign: l.source_campaign,
    sourcePage: l.source_page,
    sourceCapturedAt: l.source_captured_at,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    tags: JSON.parse(l.tags || '[]')
  })));
});

app.post('/api/leads', authenticate, async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { name, phone, email, company, source, source_type = 'manual', stage_id, pipeline_id, tags = [] } = req.body;
  if (!name?.trim() || !phone?.trim()) return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
  
  const id = Math.random().toString(36).substring(2, 9);
  db.prepare(`
    INSERT INTO leads (id, tenant_id, name, phone, email, company, source, source_type, stage_id, pipeline_id, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, tenantId, name.trim(), phone.trim(), email || null, company || null, source || 'Manual', source_type, stage_id, pipeline_id, JSON.stringify(tags));
  db.prepare('INSERT INTO lead_source_history (id, tenant_id, lead_id, source, source_type) VALUES (?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), tenantId, id, source || 'Manual', source_type);
  
  const newLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as any;
  await commitDbChanges();
  res.json({
    ...newLead,
    tenantId: newLead.tenant_id,
    stageId: newLead.stage_id,
    pipelineId: newLead.pipeline_id,
    sourceType: newLead.source_type,
    createdAt: newLead.created_at,
    updatedAt: newLead.updated_at,
    tags: JSON.parse(newLead.tags || '[]')
  });
});

app.patch('/api/leads/:id', authenticate, async (req: any, res: any) => {
  const { tenantId, role, id: userId } = req.user;
  const { id } = req.params;
  const { name, phone, email, company, source, source_type, stage_id, tags, notes } = req.body;
  
  // Verify permissions
  let lead;
  if (role === 'admin' || role === 'master') {
    lead = db.prepare('SELECT id FROM leads WHERE id = ? AND tenant_id = ?').get(id, tenantId);
  } else {
    lead = db.prepare('SELECT id FROM leads WHERE id = ? AND tenant_id = ? AND (assigned_to = ? OR owner_user_id = ?)').get(id, tenantId, userId, userId);
  }
  
  if (!lead) return res.status(404).json({ error: 'Not found or unauthorized' });
  
  if (name !== undefined && !String(name).trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
  if (phone !== undefined && !String(phone).trim()) return res.status(400).json({ error: 'Telefone é obrigatório' });
  if (stage_id) {
    const validStage = db.prepare('SELECT ps.id FROM pipeline_stages ps JOIN pipelines p ON p.id = ps.pipeline_id WHERE ps.id = ? AND p.tenant_id = ?').get(stage_id, tenantId);
    if (!validStage) return res.status(400).json({ error: 'Etapa inválida' });
    db.prepare('UPDATE leads SET stage_id = ? WHERE id = ? AND tenant_id = ?').run(stage_id, id, tenantId);
  }
  if (tags !== undefined) {
    db.prepare('UPDATE leads SET tags = ? WHERE id = ? AND tenant_id = ?').run(JSON.stringify(tags), id, tenantId);
  }
  const fields: Array<[string, unknown]> = [['name', name], ['phone', phone], ['email', email], ['company', company], ['notes', notes]];
  for (const [field, value] of fields) {
    if (value !== undefined) db.prepare(`UPDATE leads SET ${field} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`).run(value || null, id, tenantId);
  }
  if (source !== undefined) {
    const sourceType = source_type === 'automatic' ? 'automatic' : 'manual';
    db.prepare('UPDATE leads SET source = ?, source_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?').run(source, sourceType, id, tenantId);
    db.prepare('INSERT INTO lead_source_history (id, tenant_id, lead_id, source, source_type) VALUES (?, ?, ?, ?, ?)').run(crypto.randomUUID(), tenantId, id, source, sourceType);
  }
  await commitDbChanges();
  const saved = db.prepare('SELECT * FROM leads WHERE id = ? AND tenant_id = ?').get(id, tenantId) as any;
  res.json({ ...saved, tenantId: saved.tenant_id, stageId: saved.stage_id, pipelineId: saved.pipeline_id, sourceType: saved.source_type, sourceCampaign: saved.source_campaign, sourcePage: saved.source_page, sourceCapturedAt: saved.source_captured_at, createdAt: saved.created_at, updatedAt: saved.updated_at, tags: JSON.parse(saved.tags || '[]') });
});

app.get('/api/leads/:id/source-history', authenticate, (req: any, res: any) => {
  const { tenantId, role, id: userId } = req.user;
  const { id } = req.params;
  const lead = role === 'admin' || role === 'master'
    ? db.prepare('SELECT id FROM leads WHERE id = ? AND tenant_id = ?').get(id, tenantId)
    : db.prepare(`SELECT l.id FROM leads l LEFT JOIN conversations c ON c.lead_id = l.id WHERE l.id = ? AND l.tenant_id = ? AND (l.assigned_to = ? OR l.owner_user_id = ? OR c.assigned_to = ?)`).get(id, tenantId, userId, userId, userId);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado ou sem permissão' });
  res.json(db.prepare('SELECT source, source_type, campaign, source_page, created_at FROM lead_source_history WHERE lead_id = ? AND tenant_id = ? ORDER BY created_at DESC').all(id, tenantId));
});

app.get('/api/tenant/lead-capture', authenticate, (req: any, res: any) => {
  const { tenantId, role } = req.user;
  if (role !== 'admin' && role !== 'master') return res.status(403).json({ error: 'Sem permissão' });
  const settings = db.prepare('SELECT lead_capture_token FROM tenant_settings WHERE tenant_id = ?').get(tenantId) as any;
  if (!settings) return res.status(404).json({ error: 'Configurações do cliente não encontradas' });
  res.json({ endpoint: '/api/public/leads', token: settings.lead_capture_token, header: 'X-Capture-Token' });
});

// Conversations
app.post('/api/conversations', authenticate, async (req: any, res: any) => {
  const { tenantId } = req.user;
  const { lead_id } = req.body;
  
  // check if one already exists
  const existing = db.prepare('SELECT * FROM conversations WHERE lead_id = ? AND tenant_id = ?').get(lead_id, tenantId) as any;
  if (existing) {
    return res.json({
      ...existing,
      tenantId: existing.tenant_id,
      leadId: existing.lead_id,
      assignedTo: existing.assigned_to,
      createdAt: existing.created_at,
      updatedAt: existing.updated_at
    });
  }

  const id = Math.random().toString(36).substring(2, 9);
  db.prepare('INSERT INTO conversations (id, tenant_id, lead_id) VALUES (?, ?, ?)').run(id, tenantId, lead_id);
  
  const newConv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as any;
  await commitDbChanges();
  res.json({
    ...newConv,
    tenantId: newConv.tenant_id,
    leadId: newConv.lead_id,
    assignedTo: newConv.assigned_to,
    createdAt: newConv.created_at,
    updatedAt: newConv.updated_at
  });
});

app.get('/api/conversations', authenticate, (req: any, res: any) => {
  const { tenantId, role, id: userId } = req.user;
  
  let conversations;
  if (role === 'admin' || role === 'master') {
    conversations = db.prepare(`
      SELECT c.*, l.name as lead_name, l.phone as lead_phone 
      FROM conversations c
      JOIN leads l ON c.lead_id = l.id
      WHERE c.tenant_id = ?
      ORDER BY c.updated_at DESC
    `).all(tenantId);
  } else {
    conversations = db.prepare(`
      SELECT c.*, l.name as lead_name, l.phone as lead_phone 
      FROM conversations c
      JOIN leads l ON c.lead_id = l.id
      WHERE c.tenant_id = ? AND (c.assigned_to = ? OR c.assigned_to IS NULL OR c.status IN ('new', 'unassigned'))
      ORDER BY c.updated_at DESC
    `).all(tenantId, userId);
  }
  
  res.json(conversations.map((c: any) => ({
    ...c,
    tenantId: c.tenant_id,
    leadId: c.lead_id,
    assignedTo: c.assigned_to,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    leadName: c.lead_name,
    leadPhone: c.lead_phone
  })));
});

// Messages
app.get('/api/conversations/:id/messages', authenticate, (req: any, res: any) => {
  const { tenantId, role, id: userId } = req.user;
  const { id } = req.params;
  
  // Verify tenant and permissions
  let conv;
  if (role === 'admin' || role === 'master') {
    conv = db.prepare('SELECT id FROM conversations WHERE id = ? AND tenant_id = ?').get(id, tenantId);
  } else {
    conv = db.prepare('SELECT id FROM conversations WHERE id = ? AND tenant_id = ? AND assigned_to = ?').get(id, tenantId, userId);
  }
  
  if (!conv) return res.status(404).json({ error: 'Not found or unauthorized' });
  
  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(id);
  res.json(messages);
});


app.patch('/api/conversations/:id/assign', authenticate, async (req: any, res: any) => {
  const { tenantId, id: currentUserId, role } = req.user;
  const { id } = req.params;
  const { assigned_to } = req.body;
  
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND tenant_id = ?').get(id, tenantId) as any;
  if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });
  
  if (role !== 'admin' && role !== 'master') {
     if (assigned_to !== currentUserId || (conv.assigned_to && conv.assigned_to !== currentUserId)) {
        return res.status(403).json({ error: 'Não autorizado a atribuir esta conversa' });
     }
  }

  db.prepare('UPDATE conversations SET assigned_to = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
    assigned_to,
    'in_progress',
    id
  );
  
  db.prepare('INSERT INTO conversation_events (id, tenant_id, conversation_id, event_type, from_user_id, to_user_id) VALUES (?, ?, ?, ?, ?, ?)').run(
    Math.random().toString(36).substring(2, 9),
    tenantId,
    id,
    'assigned',
    currentUserId,
    assigned_to
  );

  await commitDbChanges();
  const saved = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as any;
  res.json({ ...saved, tenantId: saved.tenant_id, leadId: saved.lead_id, assignedTo: saved.assigned_to, createdAt: saved.created_at, updatedAt: saved.updated_at });
});

app.patch('/api/pipelines/:pipelineId/stages/reorder', authenticate, async (req: any, res: any) => {
  const { tenantId, role } = req.user;
  const { pipelineId } = req.params;
  const { stage_ids } = req.body;
  if (role !== 'admin' && role !== 'master') return res.status(403).json({ error: 'Sem permissão para reordenar etapas' });
  if (!Array.isArray(stage_ids) || stage_ids.length === 0 || new Set(stage_ids).size !== stage_ids.length) {
    return res.status(400).json({ error: 'A ordem das etapas é inválida' });
  }

  const stages = db.prepare(`
    SELECT ps.id FROM pipeline_stages ps
    JOIN pipelines p ON p.id = ps.pipeline_id
    WHERE ps.pipeline_id = ? AND p.tenant_id = ?
  `).all(pipelineId, tenantId) as Array<{ id: string }>;
  if (stages.length !== stage_ids.length || stages.some(stage => !stage_ids.includes(stage.id))) {
    return res.status(400).json({ error: 'Todas as etapas do funil devem ser informadas' });
  }

  db.transaction(() => {
    const update = db.prepare('UPDATE pipeline_stages SET "order" = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND pipeline_id = ?');
    stage_ids.forEach((id: string, index: number) => update.run(-(index + 1), id, pipelineId));
    stage_ids.forEach((id: string, index: number) => update.run(index, id, pipelineId));
  })();
  await commitDbChanges();
  res.json({ success: true });
});

app.patch('/api/conversations/:id/status', authenticate, async (req: any, res: any) => {
  const { tenantId, id: currentUserId, role } = req.user;
  const { id } = req.params;
  const { status, close_reason } = req.body;
  const allowedStatuses = ['in_progress', 'waiting_customer', 'waiting_agent', 'closed', 'reopened', 'archived'];
  if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Status de conversa inválido' });
  
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND tenant_id = ?').get(id, tenantId) as any;
  if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });
  
  if (role !== 'admin' && role !== 'master' && conv.assigned_to !== currentUserId) {
      return res.status(403).json({ error: 'Não autorizado' });
  }

  if (status === 'closed') {
    db.prepare('UPDATE conversations SET status = ?, closed_at = CURRENT_TIMESTAMP, closed_by = ?, close_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      status, currentUserId, close_reason || null, id
    );
  } else {
    db.prepare('UPDATE conversations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  }
  
  db.prepare('INSERT INTO conversation_events (id, tenant_id, conversation_id, event_type, from_user_id, metadata) VALUES (?, ?, ?, ?, ?, ?)').run(
    Math.random().toString(36).substring(2, 9),
    tenantId,
    id,
    'status_changed',
    currentUserId,
    status
  );

  await commitDbChanges();
  const saved = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as any;
  res.json({ ...saved, tenantId: saved.tenant_id, leadId: saved.lead_id, assignedTo: saved.assigned_to, createdAt: saved.created_at, updatedAt: saved.updated_at });
});

app.post('/api/conversations/:id/messages', authenticate, async (req: any, res: any) => {
  const { tenantId, role, id: userId } = req.user;
  const { id } = req.params;
  const { text } = req.body;
  
  let conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND tenant_id = ?').get(id, tenantId) as any;
  if (!conv) return res.status(404).json({ error: 'Not found or unauthorized' });
  
  if (role !== 'admin' && role !== 'master' && conv.assigned_to !== userId) {
    return res.status(403).json({ error: 'Conversa não atribuída a você' });
  }

  const lead = db.prepare('SELECT phone FROM leads WHERE id = ? AND tenant_id = ?').get(conv.lead_id, tenantId) as any;
  const connection = db.prepare('SELECT * FROM whatsapp_connections WHERE tenant_id = ? AND connection_status = ?').get(tenantId, 'connected') as any;

  let externalMessageId = null;
  let status = 'pending';

  if (connection && lead?.phone) {
     try {
         const result = await metaFetch(`/${connection.phone_number_id}/messages`, {
           method: 'POST',
           accessToken: decryptToken(connection),
           body: {
             messaging_product: 'whatsapp',
             to: normalizePhone(lead.phone),
             type: 'text',
             text: { body: text }
           }
         });

         if (result.messages && result.messages.length > 0) {
           externalMessageId = result.messages[0].id;
           status = 'sent';
         }
     } catch (err) {
         console.error("Meta API Fetch Error:", err);
         status = 'failed';
     }
  }

  const messageId = Math.random().toString(36).substring(2, 9);
  db.prepare('INSERT INTO messages (id, conversation_id, sender_id, sender_type, direction, channel, message_type, text, status, external_message_id, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = \'sent\' THEN CURRENT_TIMESTAMP ELSE NULL END)').run(
    messageId, id, userId, 'user', 'outbound', 'whatsapp', 'text', text, status, externalMessageId, status
  );
  if (connection && status !== 'failed') {
    db.prepare('UPDATE whatsapp_connections SET last_outbound_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(connection.id);
  }
  
  if (conv.status === 'waiting_agent' || conv.status === 'new') {
     db.prepare('UPDATE conversations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('in_progress', id);
  } else {
     db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  }
  
  const newMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
  await commitDbChanges();
  res.json(newMessage);
});


// Vite middleware for dev

// AI Routes
import { generateAiResponse } from './src/services/openaiService.js';

function getTenantAiUsageThisMonth(tenantId: string) {
  const row = db.prepare(`
    SELECT COALESCE(SUM(total_tokens), 0) as total
    FROM ai_usage_logs
    WHERE tenant_id = ?
      AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
  `).get(tenantId) as any;

  return Number(row?.total || 0);
}

async function ensureTenantCanUseAi(tenantId: string) {
  let settings = db.prepare('SELECT * FROM ai_settings WHERE tenant_id = ?').get(tenantId) as any;

  if (!settings) {
    db.prepare('INSERT INTO ai_settings (tenant_id, model) VALUES (?, ?)').run(tenantId, process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini');
    settings = db.prepare('SELECT * FROM ai_settings WHERE tenant_id = ?').get(tenantId) as any;
    await commitDbChanges();
  }

  if (!settings || !settings.enabled) {
    throw new Error('IA não habilitada para este cliente');
  }

  const used = getTenantAiUsageThisMonth(tenantId);
  const limit = settings.monthly_token_limit || 100000;

  if (used >= limit) {
    throw new Error('Limite mensal de IA atingido');
  }

  return settings;
}

app.get('/api/ai/settings', authenticate, async (req: any, res: any) => {
  const { tenantId } = req.user;
  if (!tenantId) return res.json({ enabled: 0, model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini', tone: '', company_context: '', business_rules: '', monthly_token_limit: 100000, current_usage: 0 });
  
  let settings = db.prepare('SELECT * FROM ai_settings WHERE tenant_id = ?').get(tenantId) as any;
  if (!settings) {
    db.prepare('INSERT INTO ai_settings (tenant_id, model) VALUES (?, ?)').run(tenantId, process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini');
    settings = db.prepare('SELECT * FROM ai_settings WHERE tenant_id = ?').get(tenantId) as any;
    await commitDbChanges();
  }
  
  settings.current_usage = getTenantAiUsageThisMonth(tenantId);
  res.json(settings);
});

app.patch('/api/ai/settings', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'admin' && req.user.role !== 'master') {
    return res.status(403).json({ error: 'Apenas administradores podem configurar a IA' });
  }

  const { tenantId } = req.user;
  if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
  const { enabled, model, tone, company_context, business_rules, monthly_token_limit } = req.body;
  
  let existing = db.prepare('SELECT * FROM ai_settings WHERE tenant_id = ?').get(tenantId) as any;
  if (!existing) {
    db.prepare('INSERT INTO ai_settings (tenant_id, model) VALUES (?, ?)').run(tenantId, process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini');
  }

  db.prepare(`
    UPDATE ai_settings 
    SET enabled = ?, model = ?, tone = ?, company_context = ?, business_rules = ?, monthly_token_limit = ?, updated_at = CURRENT_TIMESTAMP
    WHERE tenant_id = ?
  `).run(
    enabled ? 1 : 0, 
    model || process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini', 
    tone || '', 
    company_context || '', 
    business_rules || '', 
    monthly_token_limit || 100000, 
    tenantId
  );
  
  await commitDbChanges();
  res.json({ success: true });
});

app.post('/api/ai/suggest-reply', authenticate, async (req: any, res: any) => {
  const { tenantId, id: userId } = req.user;
  const { conversationId } = req.body;

  try {
    const settings = await ensureTenantCanUseAi(tenantId);

    const conversation = db.prepare(`
      SELECT c.*, l.name as lead_name, l.phone as lead_phone, l.email as lead_email, l.company as lead_company
      FROM conversations c
      JOIN leads l ON l.id = c.lead_id
      WHERE c.id = ? AND c.tenant_id = ?
    `).get(conversationId, tenantId) as any;

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    const messages = db.prepare(`
      SELECT sender_id, text, created_at
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(conversationId).reverse();

    const system = `
Você é um assistente de atendimento comercial dentro de um CRM conversacional.
Sua função é sugerir uma resposta para o atendente humano.
Não envie mensagem diretamente ao cliente.
Use tom: ${settings.tone || 'profissional, claro e cordial'}.
Contexto da empresa: ${settings.company_context || 'Não informado'}.
Regras comerciais: ${settings.business_rules || 'Não informado'}.
Responda em português do Brasil. Apenas forneça o texto sugerido para a resposta.
`;

    const user = JSON.stringify({
      lead: {
        name: conversation.lead_name,
        phone: conversation.lead_phone,
        email: conversation.lead_email,
        company: conversation.lead_company,
      },
      messages,
      instruction: 'Sugira uma resposta curta, humana e útil para o atendente enviar ao cliente.'
    });

    const ai = await generateAiResponse({ system, user, model: settings.model });

    const usage = (ai.usage as any) || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || inputTokens + outputTokens;

    const logId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO ai_usage_logs
      (id, tenant_id, user_id, conversation_id, lead_id, action, model, input_tokens, output_tokens, total_tokens, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      tenantId,
      userId,
      conversationId,
      conversation.lead_id,
      'suggest_reply',
      ai.model,
      inputTokens,
      outputTokens,
      totalTokens,
      'success'
    );

    await commitDbChanges();
    res.json({
      suggestion: ai.text,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/summarize-conversation', authenticate, async (req: any, res: any) => {
  const { tenantId, id: userId } = req.user;
  const { conversationId } = req.body;

  try {
    const settings = await ensureTenantCanUseAi(tenantId);

    const conversation = db.prepare(`
      SELECT c.*, l.id as lead_id, l.name as lead_name, l.phone as lead_phone, l.email as lead_email
      FROM conversations c
      JOIN leads l ON l.id = c.lead_id
      WHERE c.id = ? AND c.tenant_id = ?
    `).get(conversationId, tenantId) as any;

    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    const messages = db.prepare(`
      SELECT sender_id, text, created_at
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(conversationId);

    const system = `
Você é um assistente de CRM.
Resuma uma conversa de atendimento e devolva um JSON válido.
Não inclua formatação markdown na resposta (como \`\`\`json). Devolva apenas o JSON.
`;

    const user = `
Retorne exatamente neste formato JSON:
{
  "resumo": "",
  "pontos_importantes": [],
  "pendencias": [],
  "proxima_acao": "",
  "sentimento": "positivo | neutro | negativo",
  "temperatura": "frio | morno | quente"
}

Lead: ${conversation.lead_name}
Mensagens: ${JSON.stringify(messages)}
`;

    const ai = await generateAiResponse({ system, user, model: settings.model, temperature: 0.2 });

    let parsed;
    try {
      let cleanText = ai.text.replace(/^\`\`\`json/m, '').replace(/```$/m, '').trim();
      parsed = JSON.parse(cleanText || '{}');
    } catch {
      parsed = { resumo: ai.text };
    }

    const usage = (ai.usage as any) || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || inputTokens + outputTokens;

    const logId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO ai_usage_logs
      (id, tenant_id, user_id, conversation_id, lead_id, action, model, input_tokens, output_tokens, total_tokens, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(logId, tenantId, userId, conversationId, conversation.lead_id, 'summarize_conversation', ai.model, inputTokens, outputTokens, totalTokens, 'success');

    await commitDbChanges();
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/classify-lead', authenticate, async (req: any, res: any) => {
  const { tenantId, id: userId } = req.user;
  const { leadId } = req.body;

  try {
    const settings = await ensureTenantCanUseAi(tenantId);

    const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND tenant_id = ?').get(leadId, tenantId) as any;
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const conversations = db.prepare('SELECT id FROM conversations WHERE lead_id = ?').all(leadId);
    let allMessages: any[] = [];
    
    for (const conv of conversations) {
      const messages = db.prepare('SELECT sender_id, text, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all((conv as any).id);
      allMessages = [...allMessages, ...messages];
    }

    const system = `
Você é um assistente de CRM.
Classifique um lead baseado no seu cadastro e histórico de conversa, devolvendo um JSON válido.
Não inclua formatação markdown na resposta (como \`\`\`json). Devolva apenas o JSON.
`;

    const user = `
Retorne exatamente neste formato JSON:
{
  "intencao": "compra | suporte | dúvida | reclamação | orçamento | parceria | outro",
  "temperatura": "frio | morno | quente",
  "prioridade": "baixa | média | alta",
  "sentimento": "positivo | neutro | negativo",
  "resumo_comercial": "",
  "proxima_acao": ""
}

Lead: ${JSON.stringify(lead)}
Mensagens: ${JSON.stringify(allMessages)}
`;

    const ai = await generateAiResponse({ system, user, model: settings.model, temperature: 0.2 });

    let parsed;
    try {
      let cleanText = ai.text.replace(/^\`\`\`json/m, '').replace(/```$/m, '').trim();
      parsed = JSON.parse(cleanText || '{}');
    } catch {
      parsed = { resumo_comercial: ai.text };
    }

    const usage = (ai.usage as any) || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || inputTokens + outputTokens;

    const logId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO ai_usage_logs
      (id, tenant_id, user_id, lead_id, action, model, input_tokens, output_tokens, total_tokens, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(logId, tenantId, userId, leadId, 'classify_lead', ai.model, inputTokens, outputTokens, totalTokens, 'success');

    await commitDbChanges();
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/master/ai-usage', authenticate, (req: any, res: any) => {
  if (req.user.role !== 'master') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const usage = db.prepare(`
    SELECT 
      t.id as tenant_id,
      t.name as tenant_name,
      COALESCE(s.enabled, 0) as ai_enabled,
      COALESCE(s.model, 'gpt-4o-mini') as ai_model,
      COALESCE(s.monthly_token_limit, 100000) as monthly_limit,
      (SELECT COALESCE(SUM(total_tokens), 0) FROM ai_usage_logs WHERE tenant_id = t.id AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')) as current_usage,
      (SELECT COUNT(id) FROM ai_usage_logs WHERE tenant_id = t.id AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')) as request_count,
      (SELECT MAX(created_at) FROM ai_usage_logs WHERE tenant_id = t.id) as last_request
    FROM tenants t
    LEFT JOIN ai_settings s ON s.tenant_id = t.id
  `).all();

  res.json(usage);
});




function createId() {
  return crypto.randomUUID();
}

function requireAdmin(req: any, res: any) {
  if (req.user.role !== 'admin' && req.user.role !== 'master') {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

function getMetaConfig() {
  return {
    appId: process.env.META_APP_ID || '',
    appSecret: process.env.META_APP_SECRET || '',
    configId: process.env.META_CONFIG_ID || '',
    verifyToken: process.env.META_VERIFY_TOKEN || '',
    redirectUri: process.env.META_REDIRECT_URI || '',
    graphVersion: process.env.META_GRAPH_VERSION || 'v23.0',
    appSecretProofEnabled: process.env.META_APP_SECRET_PROOF_ENABLED !== 'false',
    stateTtlMinutes: Number(process.env.META_ONBOARDING_STATE_TTL_MINUTES || '10'),
    dataDeletionStatusUrl: process.env.META_DATA_DELETION_STATUS_URL || '',
    tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || '',
  };
}

function getMetaAvailability() {
  const config = getMetaConfig();
  const missing = ['appId', 'appSecret', 'configId', 'verifyToken', 'redirectUri', 'tokenEncryptionKey']
    .filter((key) => !config[key as keyof typeof config]);
  return { available: missing.length === 0, missing, config };
}

function getEncryptionKey() {
  return crypto.createHash('sha256').update(getMetaConfig().tokenEncryptionKey).digest();
}

function encryptToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encrypted: encrypted.toString('base64'), iv: iv.toString('base64'), authTag: authTag.toString('base64') };
}

function decryptToken(connection: any) {
  if (!connection?.access_token_encrypted) return null;
  if (!connection.access_token_iv || !connection.access_token_auth_tag) return connection.access_token_encrypted;
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(connection.access_token_iv, 'base64'));
  decipher.setAuthTag(Buffer.from(connection.access_token_auth_tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(connection.access_token_encrypted, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

function hashState(state: string) {
  return crypto.createHash('sha256').update(state).digest('hex');
}

function sanitizeForLog(payload: any) {
  if (!payload) return null;
  return JSON.stringify(payload, (_key, value) => {
    if (typeof value === 'string' && (value.startsWith('EAA') || value.length > 400)) return '[redacted]';
    return value;
  });
}

function buildMetaError(code: string, message: string, technicalMessage?: string, retryable = false) {
  return { success: false, error: { code, message, technicalMessage, retryable } };
}

function recordAudit(tenantId: string | null, userId: string | null, action: string, entityType: string, entityId?: string | null, newValue?: any) {
  db.prepare('INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, new_value) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    createId(), tenantId, userId, action, entityType, entityId || null, newValue ? sanitizeForLog(newValue) : null
  );
}

function recordMetaEvent(event: any) {
  db.prepare(`
    INSERT INTO meta_integration_events (id, tenant_id, connection_id, event_type, event_status, external_id, error_code, error_message, payload_sanitized)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    createId(),
    event.tenantId || null,
    event.connectionId || null,
    event.eventType,
    event.eventStatus || null,
    event.externalId || null,
    event.errorCode || null,
    event.errorMessage || null,
    sanitizeForLog(event.payload)
  );
}

function normalizePhone(phone?: string | null) {
  return (phone || '').replace(/\D/g, '');
}

async function metaFetch(endpoint: string, options: {
  method?: string;
  accessToken?: string;
  body?: any;
  query?: Record<string, string | number | boolean | undefined>;
  useAppSecretProof?: boolean;
} = {}) {
  const { config } = getMetaAvailability();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query || {})) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  }
  if (options.accessToken) {
    query.set('access_token', options.accessToken);
    if ((options.useAppSecretProof ?? config.appSecretProofEnabled) && config.appSecret) {
      query.set('appsecret_proof', crypto.createHmac('sha256', config.appSecret).update(options.accessToken).digest('hex'));
    }
  }
  const baseUrl = endpoint.startsWith('https://') ? endpoint : `https://graph.facebook.com/${config.graphVersion}${endpoint}`;
  const url = query.toString() ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${query.toString()}` : baseUrl;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok || json?.error) {
    const error: any = new Error(json?.error?.message || `Meta request failed (${response.status})`);
    error.status = response.status;
    error.meta = json?.error || json;
    throw error;
  }
  return json;
}

async function exchangeCodeForAccessToken(code: string) {
  const { config } = getMetaAvailability();
  const query = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    redirect_uri: config.redirectUri,
    code,
  });
  const response = await fetch(`https://graph.facebook.com/${config.graphVersion}/oauth/access_token?${query.toString()}`);
  const json = await response.json();
  if (!response.ok || json?.error || !json?.access_token) {
    const error: any = new Error(json?.error?.message || 'Failed to exchange authorization code');
    error.meta = json?.error || json;
    throw error;
  }
  return json;
}

async function validateToken(accessToken: string) {
  const { config } = getMetaAvailability();
  return metaFetch('/debug_token', {
    accessToken: `${config.appId}|${config.appSecret}`,
    query: { input_token: accessToken },
    useAppSecretProof: false,
  });
}

async function fetchPhoneDetails(phoneNumberId: string, accessToken: string) {
  return metaFetch(`/${phoneNumberId}`, {
    accessToken,
    query: { fields: 'id,display_phone_number,verified_name,code_verification_status,name_status,quality_rating,platform_type' },
  });
}

async function fetchWabaPhones(wabaId: string, accessToken: string) {
  return metaFetch(`/${wabaId}/phone_numbers`, {
    accessToken,
    query: { fields: 'id,display_phone_number,verified_name,code_verification_status,name_status,quality_rating,platform_type' },
  });
}

async function subscribeAppToWaba(wabaId: string, accessToken: string) {
  return metaFetch(`/${wabaId}/subscribed_apps`, { method: 'POST', accessToken });
}

function getConnectionStatusResponse(tenantId: string) {
  const connections = db.prepare(`
    SELECT id, tenant_id, provider, connection_status, onboarding_status, onboarding_step, onboarding_error_code, onboarding_error_message,
           meta_business_id, waba_id, phone_number_id, display_phone_number, verified_name, code_verification_status, name_status,
           quality_rating, platform_type, webhook_subscribed, app_subscribed_to_waba, phone_registered, onboarding_completed_at,
           token_last_validated_at, last_sync_at, last_health_check_at, last_health_status, last_inbound_message_at, last_outbound_message_at,
           last_status_message_at, last_error_at, connected_at, disconnected_at, created_at, updated_at
    FROM whatsapp_connections
    WHERE tenant_id = ?
    ORDER BY created_at DESC
  `).all(tenantId);
  return { available: getMetaAvailability().available, connections };
}

async function refreshConnectionFromMeta(connection: any) {
  const accessToken = decryptToken(connection);
  if (!accessToken) throw new Error('Missing decrypted access token');
  const tokenInfo = await validateToken(accessToken);
  const phone = await fetchPhoneDetails(connection.phone_number_id, accessToken);
  const wabaPhones = await fetchWabaPhones(connection.waba_id, accessToken);
  const belongsToWaba = Array.isArray(wabaPhones?.data) && wabaPhones.data.some((item: any) => item.id === connection.phone_number_id);
  db.prepare(`
    UPDATE whatsapp_connections
    SET display_phone_number = ?, verified_name = ?, code_verification_status = ?, name_status = ?, quality_rating = ?, platform_type = ?,
        phone_registered = ?, token_last_validated_at = CURRENT_TIMESTAMP, last_sync_at = CURRENT_TIMESTAMP, last_health_check_at = CURRENT_TIMESTAMP,
        last_health_status = ?, connection_status = ?, onboarding_error_code = NULL, onboarding_error_message = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    phone.display_phone_number || connection.display_phone_number || '',
    phone.verified_name || null,
    phone.code_verification_status || null,
    phone.name_status || null,
    phone.quality_rating || null,
    phone.platform_type || null,
    belongsToWaba ? 1 : 0,
    tokenInfo?.data?.is_valid ? 'healthy' : 'warning',
    tokenInfo?.data?.is_valid && belongsToWaba ? 'connected' : 'connected_warning',
    connection.id
  );
  return db.prepare('SELECT * FROM whatsapp_connections WHERE id = ?').get(connection.id) as any;
}

function isWebhookSignatureValid(req: any) {
  const appSecret = process.env.META_APP_SECRET;
  const signature = req.headers['x-hub-signature-256'];
  if (!appSecret || !signature || !req.rawBody) return false;
  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(req.rawBody).digest('hex')}`;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(String(signature));
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function getOrCreateLeadForWebhook(tenantId: string, phone: string) {
  const normalizedPhone = normalizePhone(phone);
  let lead = db.prepare('SELECT * FROM leads WHERE tenant_id = ? AND phone = ?').get(tenantId, normalizedPhone) as any;
  if (!lead) {
    const leadId = createId();
    db.prepare('INSERT INTO leads (id, tenant_id, name, phone, source) VALUES (?, ?, ?, ?, ?)').run(leadId, tenantId, `Lead ${normalizedPhone}`, normalizedPhone, 'whatsapp');
    lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId) as any;
  }
  return lead;
}

function getOrCreateConversationForWebhook(tenantId: string, leadId: string) {
  let conversation = db.prepare(`
    SELECT * FROM conversations
    WHERE tenant_id = ? AND lead_id = ? AND status != 'closed'
    ORDER BY updated_at DESC, created_at DESC
    LIMIT 1
  `).get(tenantId, leadId) as any;
  if (!conversation) {
    const conversationId = createId();
    db.prepare('INSERT INTO conversations (id, tenant_id, lead_id, status, protocol_number) VALUES (?, ?, ?, ?, ?)').run(
      conversationId, tenantId, leadId, 'waiting_agent', `WAPP-${Date.now()}`
    );
    conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId) as any;
  }
  return conversation;
}

function parseInboundMessage(message: any) {
  const messageType = message?.type || 'unsupported';
  if (messageType === 'text') return { text: message.text?.body || '', messageType };
  return { text: `[${messageType}]`, messageType };
}

app.get('/api/whatsapp/status', authenticate, (req: any, res: any) => {
  const status = getConnectionStatusResponse(req.user.tenantId);
  res.json(status.connections[0] || null);
});

app.post('/api/whatsapp/connect', authenticate, async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  const { phone_number_id, waba_id, access_token, display_phone_number } = req.body;
  if (!phone_number_id || !waba_id || !access_token) {
     return res.status(400).json(buildMetaError('META_CONFIG_MISSING', 'Faltam credenciais para a conexão manual.'));
  }
  const existingByPhone = db.prepare('SELECT tenant_id FROM whatsapp_connections WHERE phone_number_id = ? AND tenant_id != ?').get(phone_number_id, req.user.tenantId) as any;
  if (existingByPhone) {
    return res.status(409).json(buildMetaError('META_PHONE_ALREADY_ASSIGNED', 'Este número já está associado a outro tenant.'));
  }
  const encrypted = encryptToken(access_token);
  const existing = db.prepare('SELECT * FROM whatsapp_connections WHERE tenant_id = ? AND provider = ?').get(req.user.tenantId, 'meta') as any;
  if (existing) {
     db.prepare(`
       UPDATE whatsapp_connections
       SET connection_status = ?, onboarding_status = ?, onboarding_step = ?, phone_number_id = ?, waba_id = ?, display_phone_number = ?,
           access_token_encrypted = ?, access_token_iv = ?, access_token_auth_tag = ?, connected_at = CURRENT_TIMESTAMP,
           disconnected_at = NULL, token_revoked_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?
     `).run('connected_warning', 'legacy_manual', 'manual_connection', phone_number_id, waba_id, display_phone_number || '', encrypted.encrypted, encrypted.iv, encrypted.authTag, existing.id);
  } else {
     db.prepare(`
       INSERT INTO whatsapp_connections (
         id, tenant_id, provider, connection_status, onboarding_status, onboarding_step, phone_number_id, waba_id,
         display_phone_number, access_token_encrypted, access_token_iv, access_token_auth_tag, connected_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     `).run(createId(), req.user.tenantId, 'meta', 'connected_warning', 'legacy_manual', 'manual_connection', phone_number_id, waba_id, display_phone_number || '', encrypted.encrypted, encrypted.iv, encrypted.authTag);
  }
  recordAudit(req.user.tenantId, req.user.id, 'WhatsApp Conectado Manualmente', 'whatsapp_connections');
  await commitDbChanges();
  res.json({ success: true });
});

app.post('/api/whatsapp/disconnect', authenticate, async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  const connection = db.prepare('SELECT * FROM whatsapp_connections WHERE tenant_id = ? AND provider = ? ORDER BY created_at DESC LIMIT 1').get(req.user.tenantId, 'meta') as any;
  if (!connection) return res.json({ success: true });
  db.prepare(`
    UPDATE whatsapp_connections
    SET connection_status = 'disconnected', webhook_subscribed = 0, app_subscribed_to_waba = 0,
        disconnected_at = CURRENT_TIMESTAMP, token_revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(connection.id);
  recordAudit(req.user.tenantId, req.user.id, 'Meta Desconectada', 'whatsapp_connections', connection.id);
  recordMetaEvent({ tenantId: req.user.tenantId, connectionId: connection.id, eventType: 'disconnect', eventStatus: 'success' });
  await commitDbChanges();
  res.json({ success: true });
});

app.get('/api/integrations/meta/status', authenticate, (req: any, res: any) => {
  res.json(getConnectionStatusResponse(req.user.tenantId));
});

app.post('/api/integrations/meta/signup/start', authenticate, async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  const availability = getMetaAvailability();
  if (!availability.available) {
    return res.status(503).json(buildMetaError('META_CONFIG_MISSING', 'A integração com a Meta ainda não está disponível neste ambiente.', `Missing config: ${availability.missing.join(', ')}`));
  }
  const state = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + availability.config.stateTtlMinutes * 60_000).toISOString();
  db.prepare("UPDATE meta_onboarding_sessions SET status = 'invalidated' WHERE tenant_id = ? AND user_id = ? AND status = 'created'").run(req.user.tenantId, req.user.id);
  db.prepare('INSERT INTO meta_onboarding_sessions (id, tenant_id, user_id, state_hash, status, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    createId(), req.user.tenantId, req.user.id, hashState(state), 'created', expiresAt
  );
  recordAudit(req.user.tenantId, req.user.id, 'Meta Onboarding Iniciado', 'meta_onboarding_sessions', null, { expiresAt });
  await commitDbChanges();
  res.json({ appId: availability.config.appId, configId: availability.config.configId, redirectUri: availability.config.redirectUri, state, expiresAt });
});

app.post('/api/integrations/meta/signup/complete', authenticate, async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  const { code, state, sessionInfo } = req.body || {};
  if (!code || !state) {
    return res.status(400).json(buildMetaError('META_AUTH_CODE_INVALID', 'O retorno da Meta não trouxe os dados necessários para concluir a conexão.'));
  }
  const session = db.prepare('SELECT * FROM meta_onboarding_sessions WHERE tenant_id = ? AND state_hash = ? ORDER BY created_at DESC LIMIT 1').get(req.user.tenantId, hashState(state)) as any;
  if (!session) return res.status(400).json(buildMetaError('META_ONBOARDING_STATE_INVALID', 'A sessão de onboarding não é válida.'));
  if (session.status !== 'created' || session.used_at) return res.status(409).json(buildMetaError('META_ONBOARDING_STATE_INVALID', 'Esta sessão de onboarding já foi utilizada.'));
  if (new Date(session.expires_at).getTime() < Date.now()) {
    db.prepare("UPDATE meta_onboarding_sessions SET status = 'expired' WHERE id = ?").run(session.id);
    await commitDbChanges();
    return res.status(410).json(buildMetaError('META_ONBOARDING_STATE_EXPIRED', 'A sessão expirou. Inicie a conexão novamente.'));
  }

  const tenantId = req.user.tenantId;
  const existingConnection = db.prepare('SELECT * FROM whatsapp_connections WHERE tenant_id = ? AND provider = ? ORDER BY created_at DESC LIMIT 1').get(tenantId, 'meta') as any;
  const connectionId = existingConnection?.id || createId();

  try {
    const tokenExchange = await exchangeCodeForAccessToken(code);
    const accessToken = tokenExchange.access_token;
    const tokenInfo = await validateToken(accessToken);
    const wabaId = sessionInfo?.wabaId || sessionInfo?.waba_id;
    const phoneNumberId = sessionInfo?.phoneNumberId || sessionInfo?.phone_number_id;
    const metaBusinessId = sessionInfo?.businessId || sessionInfo?.business_id || null;
    if (!wabaId) throw Object.assign(new Error('Missing WABA ID from session info'), { internalCode: 'META_WABA_NOT_FOUND' });
    if (!phoneNumberId) throw Object.assign(new Error('Missing Phone Number ID from session info'), { internalCode: 'META_PHONE_NOT_FOUND' });
    const existingByPhone = db.prepare('SELECT tenant_id FROM whatsapp_connections WHERE phone_number_id = ? AND tenant_id != ?').get(phoneNumberId, tenantId) as any;
    if (existingByPhone) throw Object.assign(new Error('Phone already assigned'), { internalCode: 'META_PHONE_ALREADY_ASSIGNED' });
    const wabaPhones = await fetchWabaPhones(wabaId, accessToken);
    const phoneBelongsToWaba = Array.isArray(wabaPhones?.data) && wabaPhones.data.some((item: any) => item.id === phoneNumberId);
    if (!phoneBelongsToWaba) throw Object.assign(new Error('Phone not found in WABA'), { internalCode: 'META_PHONE_NOT_FOUND' });
    const phone = await fetchPhoneDetails(phoneNumberId, accessToken);
    await subscribeAppToWaba(wabaId, accessToken);
    const encrypted = encryptToken(accessToken);
    db.prepare(`
      INSERT INTO whatsapp_connections (
        id, tenant_id, provider, connection_status, onboarding_status, onboarding_step, onboarding_completed_at,
        meta_business_id, waba_id, phone_number_id, display_phone_number, verified_name, code_verification_status, name_status,
        quality_rating, platform_type, access_token_encrypted, access_token_iv, access_token_auth_tag, token_type,
        token_last_validated_at, webhook_subscribed, app_subscribed_to_waba, phone_registered, connected_at, disconnected_at,
        onboarding_error_code, onboarding_error_message, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, CURRENT_TIMESTAMP, NULL, NULL, NULL, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        connection_status = excluded.connection_status,
        onboarding_status = excluded.onboarding_status,
        onboarding_step = excluded.onboarding_step,
        onboarding_completed_at = excluded.onboarding_completed_at,
        meta_business_id = excluded.meta_business_id,
        waba_id = excluded.waba_id,
        phone_number_id = excluded.phone_number_id,
        display_phone_number = excluded.display_phone_number,
        verified_name = excluded.verified_name,
        code_verification_status = excluded.code_verification_status,
        name_status = excluded.name_status,
        quality_rating = excluded.quality_rating,
        platform_type = excluded.platform_type,
        access_token_encrypted = excluded.access_token_encrypted,
        access_token_iv = excluded.access_token_iv,
        access_token_auth_tag = excluded.access_token_auth_tag,
        token_type = excluded.token_type,
        token_last_validated_at = excluded.token_last_validated_at,
        webhook_subscribed = excluded.webhook_subscribed,
        app_subscribed_to_waba = excluded.app_subscribed_to_waba,
        phone_registered = excluded.phone_registered,
        connected_at = excluded.connected_at,
        disconnected_at = NULL,
        onboarding_error_code = NULL,
        onboarding_error_message = NULL,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      connectionId, tenantId, 'meta', 'connected', 'completed', 'diagnostics_ok', metaBusinessId, wabaId, phoneNumberId,
      phone.display_phone_number || '', phone.verified_name || null, phone.code_verification_status || null, phone.name_status || null,
      phone.quality_rating || null, phone.platform_type || null, encrypted.encrypted, encrypted.iv, encrypted.authTag,
      tokenExchange.token_type || tokenInfo?.data?.type || 'bearer', 1, 1, 1
    );
    db.prepare("UPDATE meta_onboarding_sessions SET status = 'used', used_at = CURRENT_TIMESTAMP WHERE id = ?").run(session.id);
    recordAudit(tenantId, req.user.id, 'Meta Onboarding Concluído', 'whatsapp_connections', connectionId, { wabaId, phoneNumberId, metaBusinessId });
    recordMetaEvent({ tenantId, connectionId, eventType: 'onboarding_completed', eventStatus: 'success', payload: { sessionInfo, tokenInfo: { is_valid: tokenInfo?.data?.is_valid } } });
    await commitDbChanges();
    res.json({ success: true, connection: getConnectionStatusResponse(tenantId).connections[0] || null });
  } catch (error: any) {
    const code = String(error.internalCode || error.meta?.code || 'META_TOKEN_EXCHANGE_FAILED');
    db.prepare(`
      INSERT INTO whatsapp_connections (id, tenant_id, provider, connection_status, onboarding_status, onboarding_step, onboarding_error_code, onboarding_error_message, last_error_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        connection_status = excluded.connection_status,
        onboarding_status = excluded.onboarding_status,
        onboarding_step = excluded.onboarding_step,
        onboarding_error_code = excluded.onboarding_error_code,
        onboarding_error_message = excluded.onboarding_error_message,
        last_error_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `).run(connectionId, tenantId, 'meta', 'failed', 'failed', 'complete', code, error.message);
    db.prepare("UPDATE meta_onboarding_sessions SET status = 'failed' WHERE id = ?").run(session.id);
    recordMetaEvent({ tenantId, connectionId, eventType: 'onboarding_failed', eventStatus: 'failed', errorCode: code, errorMessage: error.message, payload: { sessionInfo, meta: error.meta } });
    recordAudit(tenantId, req.user.id, 'Meta Onboarding Falhou', 'whatsapp_connections', connectionId, { code, message: error.message });
    await commitDbChanges();
    res.status(400).json(buildMetaError(code, code === 'META_PHONE_ALREADY_ASSIGNED' ? 'Este número já está conectado em outro tenant.' : 'Não foi possível concluir a autorização com a Meta.', error.message));
  }
});

app.post('/api/integrations/meta/status/refresh', authenticate, async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  const connection = db.prepare('SELECT * FROM whatsapp_connections WHERE tenant_id = ? AND provider = ? ORDER BY created_at DESC LIMIT 1').get(req.user.tenantId, 'meta') as any;
  if (!connection) return res.status(404).json(buildMetaError('META_WABA_NOT_FOUND', 'Nenhuma conexão da Meta foi encontrada para este tenant.'));
  try {
    const refreshed = await refreshConnectionFromMeta(connection);
    await commitDbChanges();
    res.json({ success: true, connection: getConnectionStatusResponse(req.user.tenantId).connections.find((item: any) => item.id === refreshed.id) });
  } catch (error: any) {
    db.prepare('UPDATE whatsapp_connections SET connection_status = ?, onboarding_error_code = ?, onboarding_error_message = ?, last_error_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      'connected_warning', String(error.meta?.code || 'META_TOKEN_INVALID'), error.message, connection.id
    );
    await commitDbChanges();
    res.status(400).json(buildMetaError('META_TOKEN_INVALID', 'A conexão com a Meta precisa ser validada novamente.', error.message, true));
  }
});

app.post('/api/integrations/meta/test', authenticate, async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  const connection = db.prepare('SELECT * FROM whatsapp_connections WHERE tenant_id = ? AND provider = ? ORDER BY created_at DESC LIMIT 1').get(req.user.tenantId, 'meta') as any;
  if (!connection) return res.status(404).json(buildMetaError('META_WABA_NOT_FOUND', 'Nenhuma conexão da Meta foi encontrada para teste.'));
  try {
    const accessToken = decryptToken(connection);
    const tokenInfo = await validateToken(accessToken);
    const phone = await fetchPhoneDetails(connection.phone_number_id, accessToken);
    const wabaPhones = await fetchWabaPhones(connection.waba_id, accessToken);
    const belongsToWaba = Array.isArray(wabaPhones?.data) && wabaPhones.data.some((item: any) => item.id === connection.phone_number_id);
    let sendResult: any = null;
    const destinationPhone = normalizePhone(req.body?.destinationPhone);
    if (req.body?.sendMessage && destinationPhone) {
      sendResult = await metaFetch(`/${connection.phone_number_id}/messages`, {
        method: 'POST',
        accessToken,
        body: {
          messaging_product: 'whatsapp',
          to: destinationPhone,
          type: 'text',
          text: { body: 'Mensagem de teste da integração Consult Flow com a Meta.' },
        },
      });
    }
    db.prepare('UPDATE whatsapp_connections SET last_health_check_at = CURRENT_TIMESTAMP, last_health_status = ?, last_sync_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      belongsToWaba && tokenInfo?.data?.is_valid ? 'healthy' : 'warning', connection.id
    );
    recordAudit(req.user.tenantId, req.user.id, 'Teste de Conexão Meta', 'whatsapp_connections', connection.id, { sendMessage: Boolean(sendResult) });
    await commitDbChanges();
    res.json({
      success: true,
      checks: {
        token: Boolean(tokenInfo?.data?.is_valid),
        waba: true,
        phone: Boolean(phone?.id),
        phoneBelongsToWaba: belongsToWaba,
        webhookConfigured: Boolean(getMetaConfig().verifyToken),
        sendMessageAccepted: Boolean(sendResult?.messages?.length),
      },
      sendResult,
    });
  } catch (error: any) {
    res.status(400).json(buildMetaError('META_MESSAGE_SEND_FAILED', 'O teste da conexão falhou.', error.message, true));
  }
});

app.post('/api/integrations/meta/reauthorize/start', authenticate, async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  const availability = getMetaAvailability();
  if (!availability.available) {
    return res.status(503).json(buildMetaError('META_CONFIG_MISSING', 'A integração com a Meta ainda não está disponível neste ambiente.', `Missing config: ${availability.missing.join(', ')}`));
  }
  const state = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + availability.config.stateTtlMinutes * 60_000).toISOString();
  db.prepare("UPDATE meta_onboarding_sessions SET status = 'invalidated' WHERE tenant_id = ? AND user_id = ? AND status = 'created'").run(req.user.tenantId, req.user.id);
  db.prepare('INSERT INTO meta_onboarding_sessions (id, tenant_id, user_id, state_hash, status, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    createId(), req.user.tenantId, req.user.id, hashState(state), 'created', expiresAt
  );
  await commitDbChanges();
  res.json({ appId: availability.config.appId, configId: availability.config.configId, redirectUri: availability.config.redirectUri, state, expiresAt });
});

app.post('/api/integrations/meta/deauthorize', async (req: any, res: any) => {
  const signedRequest = req.body?.signed_request;
  if (!signedRequest) return res.status(400).json(buildMetaError('META_WEBHOOK_SIGNATURE_INVALID', 'A desautorização enviada pela Meta não é válida.'));
  const payloadPart = signedRequest.split('.')[1];
  const payload = payloadPart ? JSON.parse(Buffer.from(payloadPart.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) : null;
  const businessId = payload?.user_id || payload?.business_id || null;
  const connection = businessId ? db.prepare('SELECT * FROM whatsapp_connections WHERE meta_business_id = ? ORDER BY created_at DESC LIMIT 1').get(String(businessId)) as any : null;
  if (connection) {
    db.prepare('UPDATE whatsapp_connections SET connection_status = ?, token_revoked_at = CURRENT_TIMESTAMP, disconnected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('disconnected', connection.id);
    recordMetaEvent({ tenantId: connection.tenant_id, connectionId: connection.id, eventType: 'deauthorize', eventStatus: 'success', payload });
    await commitDbChanges();
  }
  res.json({ success: true });
});

app.post('/api/integrations/meta/data-deletion', async (req: any, res: any) => {
  const confirmationCode = crypto.randomBytes(8).toString('hex');
  const connection = req.body?.business_id ? db.prepare('SELECT * FROM whatsapp_connections WHERE meta_business_id = ? ORDER BY created_at DESC LIMIT 1').get(String(req.body.business_id)) as any : null;
  db.prepare(`
    INSERT INTO meta_data_deletion_requests (id, tenant_id, connection_id, confirmation_code, status, payload_sanitized, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(createId(), connection?.tenant_id || null, connection?.id || null, confirmationCode, 'received', sanitizeForLog(req.body));
  await commitDbChanges();
  res.json({ url: `${getMetaConfig().dataDeletionStatusUrl || ''}/${confirmationCode}`, confirmation_code: confirmationCode });
});

app.get('/api/integrations/meta/data-deletion/status/:confirmationCode', (req: any, res: any) => {
  const request = db.prepare('SELECT confirmation_code, status, created_at, updated_at FROM meta_data_deletion_requests WHERE confirmation_code = ?').get(req.params.confirmationCode) as any;
  if (!request) return res.status(404).json({ error: 'Not found' });
  res.json(request);
});

app.get('/api/meta/webhook', (req: any, res: any) => {
  // Hub challenge for Meta
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.META_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});

app.post('/api/meta/webhook', async (req: any, res: any) => {
  if (!isWebhookSignatureValid(req)) {
    return res.status(401).json(buildMetaError('META_WEBHOOK_SIGNATURE_INVALID', 'Assinatura do webhook da Meta inválida.'));
  }
  const body = req.body;
  if (body.object !== 'whatsapp_business_account') {
    return res.sendStatus(404);
  }
  let hasChanges = false;
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const phoneNumberId = value.metadata?.phone_number_id;
      if (!phoneNumberId) continue;
      const connection = db.prepare('SELECT * FROM whatsapp_connections WHERE phone_number_id = ?').get(phoneNumberId) as any;
      if (!connection) continue;

      for (const message of value.messages || []) {
        const existing = db.prepare('SELECT id FROM messages WHERE external_message_id = ?').get(message.id) as any;
        if (existing) continue;
        const lead = getOrCreateLeadForWebhook(connection.tenant_id, message.from);
        const conversation = getOrCreateConversationForWebhook(connection.tenant_id, lead.id);
        const parsed = parseInboundMessage(message);
        db.prepare(`
          INSERT INTO messages (id, conversation_id, sender_id, sender_type, direction, channel, message_type, text, status, external_message_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(createId(), conversation.id, lead.id, 'lead', 'inbound', 'whatsapp', parsed.messageType, parsed.text || '[sem conteúdo]', 'received', message.id);
        db.prepare("UPDATE conversations SET status = 'waiting_agent', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(conversation.id);
        db.prepare('UPDATE whatsapp_connections SET last_inbound_message_at = CURRENT_TIMESTAMP, webhook_subscribed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(connection.id);
        recordMetaEvent({ tenantId: connection.tenant_id, connectionId: connection.id, eventType: 'webhook_message', eventStatus: 'success', externalId: message.id, payload: { type: parsed.messageType } });
        hasChanges = true;
      }

      for (const status of value.statuses || []) {
        db.prepare(`
          UPDATE messages
          SET status = ?,
              delivered_at = CASE WHEN ? = 'delivered' THEN CURRENT_TIMESTAMP ELSE delivered_at END,
              read_at = CASE WHEN ? = 'read' THEN CURRENT_TIMESTAMP ELSE read_at END,
              error_code = ?,
              error_message = ?,
              meta_status_payload = ?,
              sent_at = CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE sent_at END
          WHERE external_message_id = ?
        `).run(status.status || 'sent', status.status || '', status.status || '', status.errors?.[0]?.code || null, status.errors?.[0]?.title || null, sanitizeForLog(status), status.status || '', status.id);
        db.prepare('UPDATE whatsapp_connections SET last_status_message_at = CURRENT_TIMESTAMP, webhook_subscribed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(connection.id);
        hasChanges = true;
      }
    }
  }
  if (hasChanges) {
    await commitDbChanges();
  }
  res.sendStatus(200);
});

app.post('/api/meta/webhook-legacy', async (req: any, res: any) => {
  const body = req.body;
  let hasChanges = false;
  
  if (body.object === 'whatsapp_business_account') {
    // Implementação básica de recebimento para o MVP
    console.log("Recebido Webhook do WhatsApp", JSON.stringify(body));
    
    body.entry?.forEach((entry: any) => {
       entry.changes?.forEach((change: any) => {
          if (change.value && change.value.messages) {
              const phoneNumberId = change.value.metadata.phone_number_id;
              const msg = change.value.messages[0];
              const fromPhone = msg.from;
              
              const connection = db.prepare('SELECT tenant_id FROM whatsapp_connections WHERE phone_number_id = ?').get(phoneNumberId) as any;
              
              if (connection) {
                  let lead = db.prepare('SELECT * FROM leads WHERE tenant_id = ? AND phone = ?').get(connection.tenant_id, fromPhone) as any;
                  if (!lead) {
                      const newLeadId = Math.random().toString(36).substring(2, 9);
                      db.prepare('INSERT INTO leads (id, tenant_id, name, phone, source) VALUES (?, ?, ?, ?, ?)').run(
                         newLeadId, connection.tenant_id, 'Lead ' + fromPhone, fromPhone, 'whatsapp'
                      );
                      lead = { id: newLeadId, tenant_id: connection.tenant_id };
                      hasChanges = true;
                  }
                  
                  let conv = db.prepare('SELECT * FROM conversations WHERE tenant_id = ? AND lead_id = ? AND status != ?').get(connection.tenant_id, lead.id, 'closed') as any;
                  if (!conv) {
                      const newConvId = Math.random().toString(36).substring(2, 9);
                      db.prepare('INSERT INTO conversations (id, tenant_id, lead_id, protocol_number) VALUES (?, ?, ?, ?)').run(
                         newConvId, connection.tenant_id, lead.id, 'WAPP-' + Date.now()
                      );
                      conv = { id: newConvId };
                      hasChanges = true;
                  } else if (conv.status === 'closed') {
                     db.prepare('UPDATE conversations SET status = ? WHERE id = ?').run('reopened', conv.id);
                     hasChanges = true;
                  }
                  
                  db.prepare('INSERT INTO messages (id, conversation_id, sender_id, sender_type, direction, text, external_message_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
                      Math.random().toString(36).substring(2, 9),
                      conv.id,
                      lead.id,
                      'lead',
                      'inbound',
                      msg.text?.body || '[Arquivo]',
                      msg.id
                  );
                  hasChanges = true;
              }
          }
       });
    });
    
    if (hasChanges) {
      await commitDbChanges();
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});



app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));

async function startServer() {

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Express global error:', err);
    res.status(err.status || 500).json({ error: err.message });
  });

  

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;

export { startServer };
