import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');
content = content.replace(
  "app.get('/api/ai/settings', authenticate, (req: any, res: any) => {\n  const { tenantId } = req.user;",
  "app.get('/api/ai/settings', authenticate, (req: any, res: any) => {\n  const { tenantId } = req.user;\n  if (!tenantId) return res.json({ enabled: 0, model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini', tone: '', company_context: '', business_rules: '', monthly_token_limit: 100000, current_usage: 0 });"
);
content = content.replace(
  "app.patch('/api/ai/settings', authenticate, (req: any, res: any) => {\n  if (req.user.role !== 'admin' && req.user.role !== 'master') {\n    return res.status(403).json({ error: 'Apenas administradores podem configurar a IA' });\n  }\n\n  const { tenantId } = req.user;",
  "app.patch('/api/ai/settings', authenticate, (req: any, res: any) => {\n  if (req.user.role !== 'admin' && req.user.role !== 'master') {\n    return res.status(403).json({ error: 'Apenas administradores podem configurar a IA' });\n  }\n\n  const { tenantId } = req.user;\n  if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });"
);
fs.writeFileSync('server.ts', content);
