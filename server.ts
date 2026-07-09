import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import db from './src/db/index';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';

import 'dotenv/config';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// API Routes

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SaaS CRM Backend is running' });
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
    
    req.user = decoded;
    
    // Master impersonation logic: if master provides a tenant ID header, use it
    if (req.user.role === 'master' && req.headers['x-tenant-id']) {
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

app.post('/api/knowledge-bases', authenticate, (req: any, res: any) => {
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

app.post('/api/users', authenticate, (req: any, res: any) => {
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

app.post('/api/admin/tenants', authenticate, (req: any, res: any) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: 'Forbidden' });
  
  const { name, company_name, email, admin_name, admin_email, admin_password } = req.body;
  
  try {
    const tenantId = Math.random().toString(36).substring(2, 9);
    const userId = Math.random().toString(36).substring(2, 9);
    const hash = bcrypt.hashSync(admin_password || 'password', 10);
    const pipelineId = Math.random().toString(36).substring(2, 9);
    
    db.prepare('BEGIN').run();
    db.prepare('INSERT INTO tenants (id, name, email) VALUES (?, ?, ?)').run(tenantId, name, email);
    db.prepare('INSERT INTO tenant_settings (tenant_id, company_name) VALUES (?, ?)').run(tenantId, company_name || name);
    db.prepare('INSERT INTO users (id, tenant_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)').run(userId, tenantId, admin_name, admin_email, hash, 'admin');
    
    // Create default pipeline and stages
    db.prepare('INSERT INTO pipelines (id, tenant_id, name) VALUES (?, ?, ?)').run(pipelineId, tenantId, 'Funil de Vendas');
    db.prepare('INSERT INTO pipeline_stages (id, pipeline_id, name, "order") VALUES (?, ?, ?, ?)').run(Math.random().toString(36).substring(2, 9), pipelineId, 'Novo Lead', 0);
    db.prepare('INSERT INTO pipeline_stages (id, pipeline_id, name, "order") VALUES (?, ?, ?, ?)').run(Math.random().toString(36).substring(2, 9), pipelineId, 'Em Atendimento', 1);
    db.prepare('INSERT INTO pipeline_stages (id, pipeline_id, name, "order") VALUES (?, ?, ?, ?)').run(Math.random().toString(36).substring(2, 9), pipelineId, 'Fechamento', 2);
    
    db.prepare('COMMIT').run();
    
    res.json({ success: true, tenantId });
  } catch (err: any) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: err.message });
  }
});

// Tenant Details and Settings
app.get('/api/tenant/settings', authenticate, (req: any, res: any) => {
  const { tenantId, role } = req.user;
  if (role === 'master' && !tenantId) return res.json({ company_name: 'Master Panel', primary_color: '#4f46e5' });
  
  const settings = db.prepare('SELECT * FROM tenant_settings WHERE tenant_id = ?').get(tenantId);
  res.json(settings);
});

app.patch('/api/tenant/settings', authenticate, (req: any, res: any) => {
  const { tenantId, role } = req.user;
  if (role !== 'admin' && role !== 'master') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const { company_name, primary_color, logo_url, sidebar_color, sidebar_text_color } = req.body;
    db.prepare('UPDATE tenant_settings SET company_name = ?, primary_color = ?, logo_url = ?, sidebar_color = ?, sidebar_text_color = ? WHERE tenant_id = ?').run(company_name, primary_color, logo_url, sidebar_color, sidebar_text_color, tenantId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating tenant settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pipelines and Stages
app.get('/api/pipelines', authenticate, (req: any, res: any) => {
  const { tenantId } = req.user;
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

app.post('/api/tags', authenticate, (req: any, res: any) => {
  const { tenantId, role } = req.user;
  if (role !== 'admin' && role !== 'master') return res.status(403).json({ error: 'Forbidden' });
  
  const { name, color } = req.body;
  const id = Math.random().toString(36).substring(2, 9);
  
  db.prepare('INSERT INTO tenant_tags (id, tenant_id, name, color) VALUES (?, ?, ?, ?)').run(id, tenantId, name, color);
  
  const newTag = db.prepare('SELECT * FROM tenant_tags WHERE id = ?').get(id) as any;
  res.json({
    id: newTag.id,
    tenantId: newTag.tenant_id,
    name: newTag.name,
    color: newTag.color,
    createdAt: newTag.created_at
  });
});

app.delete('/api/tags/:id', authenticate, (req: any, res: any) => {
  const { tenantId, role } = req.user;
  if (role !== 'admin' && role !== 'master') return res.status(403).json({ error: 'Forbidden' });
  
  const { id } = req.params;
  db.prepare('DELETE FROM tenant_tags WHERE id = ? AND tenant_id = ?').run(id, tenantId);
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
    createdAt: r.created_at
  })));
});

app.post('/api/quick-replies', authenticate, (req: any, res: any) => {
  const { tenantId, role } = req.user;
  
  const { title, text } = req.body;
  const id = Math.random().toString(36).substring(2, 9);
  
  db.prepare('INSERT INTO quick_replies (id, tenant_id, title, text) VALUES (?, ?, ?, ?)').run(id, tenantId, title, text);
  
  const newReply = db.prepare('SELECT * FROM quick_replies WHERE id = ?').get(id) as any;
  res.json({
    id: newReply.id,
    tenantId: newReply.tenant_id,
    title: newReply.title,
    text: newReply.text,
    createdAt: newReply.created_at
  });
});

app.delete('/api/quick-replies/:id', authenticate, (req: any, res: any) => {
  const { tenantId, role } = req.user;
  const { id } = req.params;
  db.prepare('DELETE FROM quick_replies WHERE id = ? AND tenant_id = ?').run(id, tenantId);
  res.json({ success: true });
});

// Stages
app.post('/api/pipelines/:pipelineId/stages', authenticate, (req: any, res: any) => {
  const { tenantId, role } = req.user;
  if (role !== 'admin' && role !== 'master') return res.status(403).json({ error: 'Forbidden' });
  
  const { pipelineId } = req.params;
  const { name, order } = req.body;
  const id = Math.random().toString(36).substring(2, 9);
  
  // Verify pipeline belongs to tenant
  const pipeline = db.prepare('SELECT * FROM pipelines WHERE id = ? AND tenant_id = ?').get(pipelineId, tenantId);
  if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
  
  db.prepare('INSERT INTO pipeline_stages (id, pipeline_id, name, "order") VALUES (?, ?, ?, ?)').run(id, pipelineId, name, order);
  
  res.json({ success: true });
});

app.delete('/api/stages/:id', authenticate, (req: any, res: any) => {
  const { tenantId, role } = req.user;
  if (role !== 'admin' && role !== 'master') return res.status(403).json({ error: 'Forbidden' });
  
  const { id } = req.params;
  
  // Ensure stage belongs to tenant
  const stage = db.prepare('SELECT ps.* FROM pipeline_stages ps JOIN pipelines p ON ps.pipeline_id = p.id WHERE ps.id = ? AND p.tenant_id = ?').get(id, tenantId);
  if (!stage) return res.status(404).json({ error: 'Stage not found' });
  
  db.prepare('DELETE FROM pipeline_stages WHERE id = ?').run(id);
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
    leads = db.prepare('SELECT * FROM leads WHERE tenant_id = ? AND (assigned_to = ? OR owner_user_id = ?) ORDER BY created_at DESC').all(tenantId, userId, userId);
  }
  
  res.json(leads.map((l: any) => ({
    ...l,
    tenantId: l.tenant_id,
    stageId: l.stage_id,
    pipelineId: l.pipeline_id,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    tags: JSON.parse(l.tags || '[]')
  })));
});

app.post('/api/leads', authenticate, (req: any, res: any) => {
  const { tenantId } = req.user;
  const { name, phone, email, company, source, stage_id, pipeline_id, tags = [] } = req.body;
  
  const id = Math.random().toString(36).substring(2, 9);
  db.prepare(`
    INSERT INTO leads (id, tenant_id, name, phone, email, company, source, stage_id, pipeline_id, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, tenantId, name, phone, email, company, source, stage_id, pipeline_id, JSON.stringify(tags));
  
  const newLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as any;
  res.json({
    ...newLead,
    tenantId: newLead.tenant_id,
    stageId: newLead.stage_id,
    pipelineId: newLead.pipeline_id,
    createdAt: newLead.created_at,
    updatedAt: newLead.updated_at,
    tags: JSON.parse(newLead.tags || '[]')
  });
});

app.patch('/api/leads/:id', authenticate, (req: any, res: any) => {
  const { tenantId, role, id: userId } = req.user;
  const { id } = req.params;
  const { stage_id, tags } = req.body;
  
  // Verify permissions
  let lead;
  if (role === 'admin' || role === 'master') {
    lead = db.prepare('SELECT id FROM leads WHERE id = ? AND tenant_id = ?').get(id, tenantId);
  } else {
    lead = db.prepare('SELECT id FROM leads WHERE id = ? AND tenant_id = ? AND (assigned_to = ? OR owner_user_id = ?)').get(id, tenantId, userId, userId);
  }
  
  if (!lead) return res.status(404).json({ error: 'Not found or unauthorized' });
  
  if (stage_id) {
    db.prepare('UPDATE leads SET stage_id = ? WHERE id = ? AND tenant_id = ?').run(stage_id, id, tenantId);
  }
  if (tags) {
    db.prepare('UPDATE leads SET tags = ? WHERE id = ? AND tenant_id = ?').run(JSON.stringify(tags), id, tenantId);
  }
  res.json({ success: true });
});

// Conversations
app.post('/api/conversations', authenticate, (req: any, res: any) => {
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
      WHERE c.tenant_id = ? AND c.assigned_to = ?
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


app.patch('/api/conversations/:id/assign', authenticate, (req: any, res: any) => {
  const { tenantId, id: currentUserId, role } = req.user;
  const { id } = req.params;
  const { assigned_to } = req.body;
  
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND tenant_id = ?').get(id, tenantId) as any;
  if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });
  
  if (role !== 'admin' && role !== 'master') {
     if (conv.assigned_to && conv.assigned_to !== currentUserId && assigned_to !== currentUserId) {
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

  res.json({ success: true });
});

app.patch('/api/conversations/:id/status', authenticate, (req: any, res: any) => {
  const { tenantId, id: currentUserId, role } = req.user;
  const { id } = req.params;
  const { status, close_reason } = req.body;
  
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

  res.json({ success: true });
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
  let status = 'sent';

  if (connection && lead?.phone) {
     try {
         const response = await fetch(`https://graph.facebook.com/v19.0/${connection.phone_number_id}/messages`, {
             method: 'POST',
             headers: {
                 'Authorization': `Bearer ${connection.access_token_encrypted}`,
                 'Content-Type': 'application/json'
             },
             body: JSON.stringify({
                 messaging_product: 'whatsapp',
                 to: lead.phone,
                 type: 'text',
                 text: { body: text }
             })
         });
         
         const result = await response.json() as any;
         if (result.error) {
             console.error("Meta API Error:", result.error);
             status = 'failed';
         } else if (result.messages && result.messages.length > 0) {
             externalMessageId = result.messages[0].id;
         }
     } catch (err) {
         console.error("Meta API Fetch Error:", err);
         status = 'failed';
     }
  }

  const messageId = Math.random().toString(36).substring(2, 9);
  db.prepare('INSERT INTO messages (id, conversation_id, sender_id, sender_type, direction, text, status, external_message_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    messageId, id, userId, 'user', 'outbound', text, status, externalMessageId
  );
  
  if (conv.status === 'waiting_agent' || conv.status === 'new') {
     db.prepare('UPDATE conversations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('in_progress', id);
  } else {
     db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  }
  
  const newMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
  res.json(newMessage);
});


// Vite middleware for dev

// AI Routes
import { generateAiResponse } from './src/services/openaiService';
import crypto from 'crypto';

function getTenantAiUsageThisMonth(tenantId: string) {
  const row = db.prepare(`
    SELECT COALESCE(SUM(total_tokens), 0) as total
    FROM ai_usage_logs
    WHERE tenant_id = ?
      AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
  `).get(tenantId) as any;

  return Number(row?.total || 0);
}

function ensureTenantCanUseAi(tenantId: string) {
  let settings = db.prepare('SELECT * FROM ai_settings WHERE tenant_id = ?').get(tenantId) as any;

  if (!settings) {
    db.prepare('INSERT INTO ai_settings (tenant_id, model) VALUES (?, ?)').run(tenantId, process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini');
    settings = db.prepare('SELECT * FROM ai_settings WHERE tenant_id = ?').get(tenantId) as any;
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

app.get('/api/ai/settings', authenticate, (req: any, res: any) => {
  const { tenantId } = req.user;
  if (!tenantId) return res.json({ enabled: 0, model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini', tone: '', company_context: '', business_rules: '', monthly_token_limit: 100000, current_usage: 0 });
  
  let settings = db.prepare('SELECT * FROM ai_settings WHERE tenant_id = ?').get(tenantId) as any;
  if (!settings) {
    db.prepare('INSERT INTO ai_settings (tenant_id, model) VALUES (?, ?)').run(tenantId, process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini');
    settings = db.prepare('SELECT * FROM ai_settings WHERE tenant_id = ?').get(tenantId) as any;
  }
  
  settings.current_usage = getTenantAiUsageThisMonth(tenantId);
  res.json(settings);
});

app.patch('/api/ai/settings', authenticate, (req: any, res: any) => {
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
  
  res.json({ success: true });
});

app.post('/api/ai/suggest-reply', authenticate, async (req: any, res: any) => {
  const { tenantId, id: userId } = req.user;
  const { conversationId } = req.body;

  try {
    const settings = ensureTenantCanUseAi(tenantId);

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
    const settings = ensureTenantCanUseAi(tenantId);

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

    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/classify-lead', authenticate, async (req: any, res: any) => {
  const { tenantId, id: userId } = req.user;
  const { leadId } = req.body;

  try {
    const settings = ensureTenantCanUseAi(tenantId);

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




app.get('/api/whatsapp/status', authenticate, (req: any, res: any) => {
  const { tenantId } = req.user;
  const connection = db.prepare('SELECT * FROM whatsapp_connections WHERE tenant_id = ?').get(tenantId);
  res.json(connection || null);
});

app.post('/api/whatsapp/connect', authenticate, (req: any, res: any) => {
  const { tenantId } = req.user;
  const { phone_number_id, waba_id, access_token, display_phone_number } = req.body;
  
  if (!phone_number_id || !waba_id || !access_token) {
     return res.status(400).json({ error: 'Faltam credenciais' });
  }

  const existing = db.prepare('SELECT * FROM whatsapp_connections WHERE tenant_id = ?').get(tenantId);
  
  if (existing) {
     db.prepare('UPDATE whatsapp_connections SET connection_status = ?, phone_number_id = ?, waba_id = ?, display_phone_number = ?, access_token_encrypted = ?, connected_at = CURRENT_TIMESTAMP WHERE tenant_id = ?').run(
       'connected', phone_number_id, waba_id, display_phone_number || '', access_token, tenantId
     );
  } else {
     db.prepare('INSERT INTO whatsapp_connections (id, tenant_id, connection_status, phone_number_id, waba_id, display_phone_number, access_token_encrypted, connected_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)').run(
       Math.random().toString(36).substring(2, 9), tenantId, 'connected', phone_number_id, waba_id, display_phone_number || '', access_token
     );
  }
  
  db.prepare('INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type) VALUES (?, ?, ?, ?, ?)').run(
    Math.random().toString(36).substring(2, 9), tenantId, req.user.id, 'WhatsApp Conectado', 'whatsapp_connections'
  );
  
  res.json({ success: true });
});

app.post('/api/whatsapp/disconnect', authenticate, (req: any, res: any) => {
  const { tenantId } = req.user;
  db.prepare('DELETE FROM whatsapp_connections WHERE tenant_id = ?').run(tenantId);
  
  db.prepare('INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type) VALUES (?, ?, ?, ?, ?)').run(
    Math.random().toString(36).substring(2, 9), tenantId, req.user.id, 'WhatsApp Desconectado', 'whatsapp_connections'
  );
  
  res.json({ success: true });
});

app.get('/api/meta/webhook', (req: any, res: any) => {
  // Hub challenge for Meta
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.META_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});

app.post('/api/meta/webhook', (req: any, res: any) => {
  const body = req.body;
  
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
                  }
                  
                  let conv = db.prepare('SELECT * FROM conversations WHERE tenant_id = ? AND lead_id = ? AND status != ?').get(connection.tenant_id, lead.id, 'closed') as any;
                  if (!conv) {
                      const newConvId = Math.random().toString(36).substring(2, 9);
                      db.prepare('INSERT INTO conversations (id, tenant_id, lead_id, protocol_number) VALUES (?, ?, ?, ?)').run(
                         newConvId, connection.tenant_id, lead.id, 'WAPP-' + Date.now()
                      );
                      conv = { id: newConvId };
                  } else if (conv.status === 'closed') {
                     db.prepare('UPDATE conversations SET status = ? WHERE id = ?').run('reopened', conv.id);
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
              }
          }
       });
    });
    
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});



app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));

async function startServer() {

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

startServer();
