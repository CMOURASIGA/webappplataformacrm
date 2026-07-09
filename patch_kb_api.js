import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

const kbEndpoints = `
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
`;

if (!content.includes('/api/knowledge-bases')) {
   content = content.replace("app.get('/api/users'", kbEndpoints + "\napp.get('/api/users'");
   fs.writeFileSync('server.ts', content);
}
