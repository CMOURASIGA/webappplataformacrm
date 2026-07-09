import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

const newEndpoints = `
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
`;

if (!content.includes('/api/users')) {
   content = content.replace("app.get('/api/dashboard/tenant", newEndpoints + "\napp.get('/api/dashboard/tenant");
   fs.writeFileSync('server.ts', content);
}
