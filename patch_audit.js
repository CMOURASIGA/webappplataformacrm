import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.db');
const db = new Database(dbPath);

const auditTable = `CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

db.exec(auditTable);

let schema = fs.readFileSync('src/db/schema.sql', 'utf-8');
if (!schema.includes('audit_logs')) {
   schema += '\n\n' + auditTable + '\n';
   fs.writeFileSync('src/db/schema.sql', schema);
}
