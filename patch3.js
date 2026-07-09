import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');
content = content.replaceAll(
  "db.prepare('INSERT INTO ai_settings (tenant_id) VALUES (?)').run(tenantId);",
  "db.prepare('INSERT INTO ai_settings (tenant_id, model) VALUES (?, ?)').run(tenantId, process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini');"
);
fs.writeFileSync('server.ts', content);
