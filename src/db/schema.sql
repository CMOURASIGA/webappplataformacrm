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
  lead_capture_token TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT, -- NULL for master
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL, -- master, admin, user
  can_import_leads INTEGER NOT NULL DEFAULT 0,
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
  source_type TEXT DEFAULT 'manual',
  source_campaign TEXT,
  source_page TEXT,
  source_captured_at DATETIME,
  classification TEXT,
  classification_details TEXT,
  classified_at DATETIME,
  classified_by TEXT,
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
  message_type TEXT DEFAULT 'text',
  text TEXT NOT NULL,
  status TEXT DEFAULT 'sent', -- sent, delivered, read, failed
  error_code TEXT,
  error_message TEXT,
  meta_status_payload TEXT,
  sent_at DATETIME,
  delivered_at DATETIME,
  read_at DATETIME,
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
  provider TEXT NOT NULL DEFAULT 'meta',
  connection_status TEXT NOT NULL DEFAULT 'not_connected',
  onboarding_status TEXT,
  onboarding_step TEXT,
  onboarding_error_code TEXT,
  onboarding_error_message TEXT,
  meta_business_id TEXT,
  display_phone_number TEXT,
  verified_name TEXT,
  code_verification_status TEXT,
  name_status TEXT,
  quality_rating TEXT,
  platform_type TEXT,
  phone_number_id TEXT,
  waba_id TEXT,
  access_token_iv TEXT,
  access_token_auth_tag TEXT,
  access_token_encrypted TEXT,
  token_type TEXT,
  token_expires_at DATETIME,
  token_last_validated_at DATETIME,
  webhook_subscribed INTEGER NOT NULL DEFAULT 0,
  app_subscribed_to_waba INTEGER NOT NULL DEFAULT 0,
  phone_registered INTEGER NOT NULL DEFAULT 0,
  onboarding_completed_at DATETIME,
  last_sync_at DATETIME,
  last_health_check_at DATETIME,
  last_health_status TEXT,
  last_inbound_message_at DATETIME,
  last_outbound_message_at DATETIME,
  last_status_message_at DATETIME,
  last_error_at DATETIME,
  connected_at DATETIME,
  disconnected_at DATETIME,
  token_revoked_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meta_onboarding_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  state_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meta_integration_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  connection_id TEXT,
  event_type TEXT NOT NULL,
  event_status TEXT,
  external_id TEXT,
  error_code TEXT,
  error_message TEXT,
  payload_sanitized TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE SET NULL,
  FOREIGN KEY (connection_id) REFERENCES whatsapp_connections (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS meta_data_deletion_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  connection_id TEXT,
  confirmation_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  payload_sanitized TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE SET NULL,
  FOREIGN KEY (connection_id) REFERENCES whatsapp_connections (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS quick_replies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  category TEXT DEFAULT 'Geral',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lead_source_history (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  source TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual',
  campaign TEXT,
  source_page TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_stage_order
ON pipeline_stages(pipeline_id, "order");


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

CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_phone_number_unique
ON whatsapp_connections(phone_number_id)
WHERE phone_number_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_tenant
ON whatsapp_connections(tenant_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status
ON whatsapp_connections(connection_status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_meta_onboarding_state_hash
ON meta_onboarding_sessions(state_hash);

CREATE INDEX IF NOT EXISTS idx_meta_onboarding_expiration
ON meta_onboarding_sessions(expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_external_id_unique
ON messages(external_message_id)
WHERE external_message_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_meta_data_deletion_confirmation_code
ON meta_data_deletion_requests(confirmation_code);

-- Epic 09: official service records, kept separate from external messages.
CREATE TABLE IF NOT EXISTS lead_service_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  conversation_id TEXT,
  attendant_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'external_conversation',
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  started_at DATETIME NOT NULL,
  ended_at DATETIME NOT NULL,
  first_message_id TEXT,
  last_message_id TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  summary TEXT NOT NULL,
  topics_json TEXT NOT NULL DEFAULT '[]',
  needs_json TEXT NOT NULL DEFAULT '[]',
  objections_json TEXT NOT NULL DEFAULT '[]',
  decisions_json TEXT NOT NULL DEFAULT '[]',
  pending_items_json TEXT NOT NULL DEFAULT '[]',
  next_action TEXT,
  next_action_due_at DATETIME,
  sentiment TEXT,
  ai_model TEXT,
  generated_at DATETIME,
  reviewed_by TEXT NOT NULL,
  reviewed_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE SET NULL,
  FOREIGN KEY (attendant_id) REFERENCES users (id) ON DELETE RESTRICT,
  FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_record_message_range ON lead_service_records(conversation_id, first_message_id, last_message_id) WHERE conversation_id IS NOT NULL AND first_message_id IS NOT NULL AND last_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_records_lead ON lead_service_records(tenant_id, lead_id, created_at DESC);

-- Epic 09: internal collaboration never shares the external messages table.
CREATE TABLE IF NOT EXISTS internal_channels (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK(type IN ('direct', 'group', 'company', 'lead')),
  lead_id TEXT,
  created_by TEXT NOT NULL,
  is_private INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_internal_channel_lead ON internal_channels(tenant_id, lead_id) WHERE type = 'lead' AND lead_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS internal_channel_members (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_read_at DATETIME,
  FOREIGN KEY (channel_id) REFERENCES internal_channels (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE(channel_id, user_id)
);
CREATE TABLE IF NOT EXISTS internal_messages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  text TEXT NOT NULL,
  reply_to_message_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  edited_at DATETIME,
  deleted_at DATETIME,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  FOREIGN KEY (channel_id) REFERENCES internal_channels (id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE RESTRICT,
  FOREIGN KEY (reply_to_message_id) REFERENCES internal_messages (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_internal_messages_channel ON internal_messages(channel_id, created_at);
CREATE TABLE IF NOT EXISTS internal_message_mentions (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  mentioned_user_id TEXT NOT NULL,
  read_at DATETIME,
  FOREIGN KEY (message_id) REFERENCES internal_messages (id) ON DELETE CASCADE,
  FOREIGN KEY (mentioned_user_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE(message_id, mentioned_user_id)
);

-- Epic 09: each import and source row remains traceable.
CREATE TABLE IF NOT EXISTS lead_import_batches (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  duplicate_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  settings_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS lead_import_rows (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  raw_data_json TEXT NOT NULL,
  normalized_data_json TEXT,
  status TEXT NOT NULL,
  lead_id TEXT,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES lead_import_batches (id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_import_rows_batch ON lead_import_rows(batch_id, row_number);
