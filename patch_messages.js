import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

const newMessages = `
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
         const response = await fetch(\`https://graph.facebook.com/v19.0/\${connection.phone_number_id}/messages\`, {
             method: 'POST',
             headers: {
                 'Authorization': \`Bearer \${connection.access_token_encrypted}\`,
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
`;

content = content.replace(/app\.post\('\/api\/conversations\/:id\/messages'[\s\S]*?res\.json\(newMessage\);\n\}\);/m, newMessages.trim());
fs.writeFileSync('server.ts', content);
