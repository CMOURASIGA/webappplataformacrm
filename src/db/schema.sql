CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  segment TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active', -- active, suspended, implementation, cancelled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#4f46e5',
  sidebar_color TEXT DEFAULT '#0F172A',
  sidebar_text_color TEXT DEFAULT '#cbd5e1',
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT, -- NULL for master
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL, -- master, admin, user
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pipelines (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id TEXT PRIMARY KEY,
  pipeline_id TEXT NOT NULL,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pipeline_id) REFERENCES pipelines (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  stage_id TEXT,
  pipeline_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT DEFAULT '',
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES pipeline_stages (id) ON DELETE SET NULL,
  FOREIGN KEY (pipeline_id) REFERENCES pipelines (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  assigned_to TEXT,
  status TEXT DEFAULT 'unassigned', -- new, unassigned, assigned, in_progress, waiting_customer, waiting_agent, closed, reopened, transferred
  protocol_number TEXT,
  closed_at DATETIME,
  closed_by TEXT,
  close_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_type TEXT DEFAULT 'user', -- system, user_id, or lead_id
  external_message_id TEXT,
  channel TEXT DEFAULT 'whatsapp',
  direction TEXT DEFAULT 'outbound',
  text TEXT NOT NULL,
  status TEXT DEFAULT 'sent', -- sent, delivered, read, failed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tenant_tags (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#4f46e5',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  provider TEXT DEFAULT 'meta',
  connection_status TEXT DEFAULT 'pending',
  display_phone_number TEXT,
  phone_number_id TEXT,
  waba_id TEXT,
  access_token_encrypted TEXT,
  connected_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quick_replies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS ai_settings (
  tenant_id TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT 0,
  model TEXT DEFAULT 'gpt-4o-mini',
  tone TEXT DEFAULT 'profissional, claro e cordial',
  company_context TEXT,
  business_rules TEXT,
  max_tokens_per_request INTEGER DEFAULT 1200,
  monthly_token_limit INTEGER DEFAULT 100000,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  conversation_id TEXT,
  lead_id TEXT,
  action TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  estimated_cost_usd REAL DEFAULT 0,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE SET NULL,
  FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ai_outputs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  conversation_id TEXT,
  lead_id TEXT,
  action TEXT NOT NULL,
  prompt TEXT,
  output_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE SET NULL,
  FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS knowledge_bases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  knowledge_base_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'indexed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_personas (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  tone TEXT NOT NULL,
  instructions TEXT,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_assistants (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT,
  persona_id TEXT,
  knowledge_base_id TEXT,
  enabled BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS whatsapp_templates (
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
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  template_id TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at DATETIME,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_presence (
  user_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  status TEXT DEFAULT 'offline',
  last_seen_at DATETIME,
  paused_reason TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversation_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  from_user_id TEXT,
  to_user_id TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
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
);

CREATE TABLE IF NOT EXISTS audit_logs (
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
);
