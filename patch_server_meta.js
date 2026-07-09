import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

const newEndpoints = `
app.get('/api/whatsapp/status', authenticate, (req: any, res: any) => {
  const { tenantId } = req.user;
  const connection = db.prepare('SELECT * FROM whatsapp_connections WHERE tenant_id = ?').get(tenantId);
  res.json(connection || null);
});

app.post('/api/whatsapp/connect', authenticate, (req: any, res: any) => {
  const { tenantId } = req.user;
  const { code } = req.body; // Mocked code
  
  const existing = db.prepare('SELECT * FROM whatsapp_connections WHERE tenant_id = ?').get(tenantId);
  
  if (existing) {
     db.prepare('UPDATE whatsapp_connections SET connection_status = ?, phone_number_id = ?, waba_id = ?, display_phone_number = ?, connected_at = CURRENT_TIMESTAMP WHERE tenant_id = ?').run(
       'connected', '1234567890', '0987654321', '+55 11 99999-9999', tenantId
     );
  } else {
     db.prepare('INSERT INTO whatsapp_connections (id, tenant_id, connection_status, phone_number_id, waba_id, display_phone_number, connected_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)').run(
       Math.random().toString(36).substring(2, 9), tenantId, 'connected', '1234567890', '0987654321', '+55 11 99999-9999'
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
`;

if (!content.includes('/api/whatsapp/status')) {
    content = content.replace("app.listen(PORT", newEndpoints + "\napp.listen(PORT");
}

fs.writeFileSync('server.ts', content);
