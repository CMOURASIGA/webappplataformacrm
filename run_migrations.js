import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.db');
const db = new Database(dbPath);

const alters = [
  // messages
  "ALTER TABLE messages ADD COLUMN external_message_id TEXT",
  "ALTER TABLE messages ADD COLUMN channel TEXT DEFAULT 'whatsapp'",
  "ALTER TABLE messages ADD COLUMN direction TEXT DEFAULT 'outbound'",
  
  // conversations
  "ALTER TABLE conversations ADD COLUMN protocol_number TEXT",
  "ALTER TABLE conversations ADD COLUMN closed_at DATETIME",
  "ALTER TABLE conversations ADD COLUMN closed_by TEXT",
  "ALTER TABLE conversations ADD COLUMN close_reason TEXT",
  
  // knowledge base
  `CREATE TABLE IF NOT EXISTS knowledge_bases (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS knowledge_documents (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    knowledge_base_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    file_url TEXT,
    status TEXT DEFAULT 'indexed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // ai_personas
  `CREATE TABLE IF NOT EXISTS ai_personas (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    tone TEXT NOT NULL,
    instructions TEXT,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // ai_assistants
  `CREATE TABLE IF NOT EXISTS ai_assistants (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    department TEXT,
    persona_id TEXT,
    knowledge_base_id TEXT,
    enabled BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // whatsapp_templates
  `CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    meta_template_id TEXT,
    name TEXT NOT NULL,
    language TEXT DEFAULT 'pt_BR',
    category TEXT,
    status TEXT DEFAULT 'draft',
    components_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // campaigns
  `CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    template_id TEXT,
    status TEXT DEFAULT 'draft',
    scheduled_at DATETIME,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // agent_presence
  `CREATE TABLE IF NOT EXISTS agent_presence (
    user_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    status TEXT DEFAULT 'offline',
    last_seen_at DATETIME,
    paused_reason TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // conversation_events
  `CREATE TABLE IF NOT EXISTS conversation_events (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    from_user_id TEXT,
    to_user_id TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // tasks
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    lead_id TEXT,
    conversation_id TEXT,
    assigned_to TEXT,
    title TEXT NOT NULL,
    description TEXT,
    due_at DATETIME,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
];

for (const alter of alters) {
  try {
    db.exec(alter);
    console.log("Executed: " + alter.split('\n')[0]);
  } catch (e) {
    if (e.message.includes('already exists')) {
      // ignore
    } else {
      console.log("Skipped or Error on " + alter.split('\n')[0] + ": " + e.message);
    }
  }
}

// Update schema.sql
let schema = fs.readFileSync('src/db/schema.sql', 'utf-8');

// messages
if (!schema.includes('external_message_id TEXT')) {
  schema = schema.replace(
    "sender_type TEXT DEFAULT 'user', -- system, user_id, or lead_id",
    "sender_type TEXT DEFAULT 'user', -- system, user_id, or lead_id\n  external_message_id TEXT,\n  channel TEXT DEFAULT 'whatsapp',\n  direction TEXT DEFAULT 'outbound',"
  );
}

// conversations
if (!schema.includes('protocol_number TEXT')) {
  schema = schema.replace(
    "status TEXT DEFAULT 'new', -- new, unassigned, assigned, in_progress, waiting_customer, waiting_agent, closed",
    "status TEXT DEFAULT 'unassigned', -- new, unassigned, assigned, in_progress, waiting_customer, waiting_agent, closed, reopened, transferred\n  protocol_number TEXT,\n  closed_at DATETIME,\n  closed_by TEXT,\n  close_reason TEXT,"
  );
}

const appendTables = [
  // knowledge base
  `CREATE TABLE IF NOT EXISTS knowledge_bases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`,
  `CREATE TABLE IF NOT EXISTS knowledge_documents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  knowledge_base_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'indexed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`,

  // ai_personas
  `CREATE TABLE IF NOT EXISTS ai_personas (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  tone TEXT NOT NULL,
  instructions TEXT,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`,

  // ai_assistants
  `CREATE TABLE IF NOT EXISTS ai_assistants (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT,
  persona_id TEXT,
  knowledge_base_id TEXT,
  enabled BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`,

  // whatsapp_templates
  `CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  meta_template_id TEXT,
  name TEXT NOT NULL,
  language TEXT DEFAULT 'pt_BR',
  category TEXT,
  status TEXT DEFAULT 'draft',
  components_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`,

  // campaigns
  `CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  template_id TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at DATETIME,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`,

  // agent_presence
  `CREATE TABLE IF NOT EXISTS agent_presence (
  user_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  status TEXT DEFAULT 'offline',
  last_seen_at DATETIME,
  paused_reason TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`,

  // conversation_events
  `CREATE TABLE IF NOT EXISTS conversation_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  from_user_id TEXT,
  to_user_id TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`,

  // tasks
  `CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  lead_id TEXT,
  conversation_id TEXT,
  assigned_to TEXT,
  title TEXT NOT NULL,
  description TEXT,
  due_at DATETIME,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`
];

for (const table of appendTables) {
  if (!schema.includes(table.split('\\n')[0])) {
    schema += '\\n\\n' + table;
  }
}

fs.writeFileSync('src/db/schema.sql', schema);

