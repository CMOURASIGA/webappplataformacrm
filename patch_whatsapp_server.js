import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

const updatedConnect = `
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
`;

content = content.replace(/app\.post\('\/api\/whatsapp\/connect'[\s\S]*?res\.json\(\{ success: true \}\);\n\}\);/m, updatedConnect.trim());
fs.writeFileSync('server.ts', content);
