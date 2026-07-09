import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

// Patch suggest-reply
content = content.replace(
  "logAiUsage(tenantId, userId, conversationId, null, 'suggest_reply', settings.model, estimatedInputTokens, estimatedOutputTokens, estimatedTotalTokens, cost);",
  `logAiUsage(tenantId, userId, conversationId, null, 'suggest_reply', settings.model, estimatedInputTokens, estimatedOutputTokens, estimatedTotalTokens, cost);
    db.prepare('INSERT INTO ai_outputs (id, tenant_id, user_id, conversation_id, action, prompt, output_json) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      Math.random().toString(36).substring(2, 9), tenantId, userId, conversationId, 'suggest_reply', null, JSON.stringify(reply)
    );`
);

// Patch summarize-conversation
content = content.replace(
  "logAiUsage(tenantId, userId, conversationId, conversation.lead_id, 'summarize_conversation', settings.model, estimatedInputTokens, estimatedOutputTokens, estimatedTotalTokens, cost);",
  `logAiUsage(tenantId, userId, conversationId, conversation.lead_id, 'summarize_conversation', settings.model, estimatedInputTokens, estimatedOutputTokens, estimatedTotalTokens, cost);
    db.prepare('INSERT INTO ai_outputs (id, tenant_id, user_id, conversation_id, lead_id, action, prompt, output_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      Math.random().toString(36).substring(2, 9), tenantId, userId, conversationId, conversation.lead_id, 'summarize_conversation', null, JSON.stringify(summary)
    );`
);

// Patch classify-lead
content = content.replace(
  "logAiUsage(tenantId, userId, null, leadId, 'classify_lead', settings.model, estimatedInputTokens, estimatedOutputTokens, estimatedTotalTokens, cost);",
  `logAiUsage(tenantId, userId, null, leadId, 'classify_lead', settings.model, estimatedInputTokens, estimatedOutputTokens, estimatedTotalTokens, cost);
    db.prepare('INSERT INTO ai_outputs (id, tenant_id, user_id, lead_id, action, prompt, output_json) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      Math.random().toString(36).substring(2, 9), tenantId, userId, leadId, 'classify_lead', null, JSON.stringify(classification)
    );`
);

fs.writeFileSync('server.ts', content);
