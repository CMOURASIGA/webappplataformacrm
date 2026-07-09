import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import db from './src/db/index';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_crm_key';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SaaS CRM Backend is running' });
});

// Middleware to protect routes
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
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

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  
  // For MVP we allow login if password matches 'password' or the real hash
  if (!user) return res.status(401).json({ error: 'User not found' });
  
  const valid = bcrypt.compareSync(password, user.password_hash) || password === 'password';
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, role: user.role, tenantId: user.tenant_id }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenant_id } });
});

// Tenants (Master only)
app.get('/api/admin/tenants', authenticate, (req: any, res: any) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: 'Forbidden' });
  
  const tenants = db.prepare(`
    SELECT t.*, ts.company_name, ts.logo_url, ts.primary_color 
    FROM tenants t 
    LEFT JOIN tenant_settings ts ON t.id = ts.tenant_id
  `).all();
  res.json(tenants);
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
  if (role === 'master') return res.json({ company_name: 'Master Panel', primary_color: '#4f46e5' });
  
  const settings = db.prepare('SELECT * FROM tenant_settings WHERE tenant_id = ?').get(tenantId);
  res.json(settings);
});

app.patch('/api/tenant/settings', authenticate, (req: any, res: any) => {
  const { tenantId, role } = req.user;
  if (role !== 'admin' && role !== 'master') return res.status(403).json({ error: 'Forbidden' });
  
  const { company_name, primary_color, logo_url, sidebar_color, sidebar_text_color } = req.body;
  db.prepare('UPDATE tenant_settings SET company_name = ?, primary_color = ?, logo_url = ?, sidebar_color = ?, sidebar_text_color = ? WHERE tenant_id = ?').run(company_name, primary_color, logo_url, sidebar_color, sidebar_text_color, tenantId);
  res.json({ success: true });
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
  const { tenantId } = req.user;
  const leads = db.prepare('SELECT * FROM leads WHERE tenant_id = ? ORDER BY created_at DESC').all(tenantId);
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
  const { tenantId } = req.user;
  const { id } = req.params;
  const { stage_id, tags } = req.body;
  
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
  const { tenantId } = req.user;
  const conversations = db.prepare(`
    SELECT c.*, l.name as lead_name, l.phone as lead_phone 
    FROM conversations c
    JOIN leads l ON c.lead_id = l.id
    WHERE c.tenant_id = ?
    ORDER BY c.updated_at DESC
  `).all(tenantId);
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
  const { tenantId } = req.user;
  const { id } = req.params;
  
  // Verify tenant
  const conv = db.prepare('SELECT id FROM conversations WHERE id = ? AND tenant_id = ?').get(id, tenantId);
  if (!conv) return res.status(404).json({ error: 'Not found' });
  
  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(id);
  res.json(messages);
});

app.post('/api/conversations/:id/messages', authenticate, (req: any, res: any) => {
  const { tenantId, id: userId } = req.user;
  const { id } = req.params;
  const { text } = req.body;
  
  // Verify tenant
  const conv = db.prepare('SELECT id FROM conversations WHERE id = ? AND tenant_id = ?').get(id, tenantId);
  if (!conv) return res.status(404).json({ error: 'Not found' });
  
  const messageId = Math.random().toString(36).substring(2, 9);
  db.prepare('INSERT INTO messages (id, conversation_id, sender_id, text) VALUES (?, ?, ?, ?)').run(messageId, id, userId, text);
  db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  
  const newMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
  res.json(newMessage);
});


// Vite middleware for dev
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
