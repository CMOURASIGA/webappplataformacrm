import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf-8');

const newEndpoints = `
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

    const clientsUsage = db.prepare(\`
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
    \`).all();

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

    const leadsQuery = \`SELECT status, COUNT(*) as count FROM leads WHERE \${leadFilter} GROUP BY status\`;
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

    const convQuery = \`SELECT status, COUNT(*) as count FROM conversations WHERE \${convFilter} GROUP BY status\`;
    const convByStatus = db.prepare(convQuery).all(...cParams) as any[];

    const totalConversations = convByStatus.reduce((acc, curr) => acc + curr.count, 0);
    const openConversations = convByStatus.filter(s => s.status !== 'closed').reduce((acc, curr) => acc + curr.count, 0);
    const waitingConversations = convByStatus.find(s => s.status === 'waiting_client')?.count || 0;
    const closedConversations = convByStatus.find(s => s.status === 'closed')?.count || 0;

    let mParams = [...cParams];
    const messagesQuery = \`
      SELECT sender_type, COUNT(*) as count 
      FROM messages m 
      JOIN conversations c ON m.conversation_id = c.id 
      WHERE c.\${convFilter} 
      GROUP BY sender_type
    \`;
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
    const aiUsageQuery = \`SELECT action, COUNT(*) as count, COALESCE(SUM(total_tokens), 0) as tokens FROM ai_usage_logs WHERE \${aiFilter} GROUP BY action\`;
    const aiUsageByAction = db.prepare(aiUsageQuery).all(...aiParams) as any[];
    
    const totalAiTokens = aiUsageByAction.reduce((acc, curr) => acc + curr.tokens, 0);
    const totalAiCalls = aiUsageByAction.reduce((acc, curr) => acc + curr.count, 0);

    // Leads by stage (Pipeline)
    const leadsByStageQuery = \`
      SELECT s.name as stage_name, COUNT(l.id) as count 
      FROM stages s
      LEFT JOIN leads l ON l.stage_id = s.id AND l.\${leadFilter.replace('tenant_id', 'l.tenant_id')}
      WHERE s.tenant_id = ?
      GROUP BY s.id
      ORDER BY s.order_index ASC
    \`;
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
`;

content = content.replace("// API Routes\n", "// API Routes\n" + newEndpoints);
fs.writeFileSync('server.ts', content);
console.log("Patched server.ts with dashboard endpoints");
