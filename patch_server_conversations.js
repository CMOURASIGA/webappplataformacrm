import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

const newEndpoints = `
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
`;

if (!content.includes('/api/conversations/:id/assign')) {
    content = content.replace("app.post('/api/conversations/:id/messages', authenticate", newEndpoints + "\napp.post('/api/conversations/:id/messages', authenticate");
}

fs.writeFileSync('server.ts', content);
