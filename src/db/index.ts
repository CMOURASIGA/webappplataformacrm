import Database from 'better-sqlite3';
import { BlobNotFoundError, get, head, put } from '@vercel/blob';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const sourceDbPath = path.join(process.cwd(), 'data.db');
const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
const blobPathname = 'crm/data.db';
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
const usesBlobPersistence = Boolean(blobToken);

function resolveLocalDbPath() {
  if (usesBlobPersistence) {
    return path.join('/tmp', 'data.db');
  }

  let dbPath = sourceDbPath;

  try {
    fs.accessSync(process.cwd(), fs.constants.W_OK);
    if (fs.existsSync(sourceDbPath)) {
      fs.accessSync(sourceDbPath, fs.constants.W_OK);
    }
  } catch {
    dbPath = path.join('/tmp', 'data.db');
    if (fs.existsSync(sourceDbPath) && !fs.existsSync(dbPath)) {
      fs.copyFileSync(sourceDbPath, dbPath);
    }
  }

  return dbPath;
}

const localDbPath = resolveLocalDbPath();

let connection: Database.Database | null = null;
let initPromise: Promise<void> | null = null;
let dirty = false;
let lastBlobEtag: string | null = null;

function ensureLocalDbDirectory() {
  fs.mkdirSync(path.dirname(localDbPath), { recursive: true });
}

function closeConnection() {
  if (connection) {
    connection.close();
    connection = null;
  }
}

function getConnection() {
  if (!connection) {
    ensureLocalDbDirectory();
    connection = new Database(localDbPath);
  }

  return connection;
}

function copyBundledDatabaseIfNeeded() {
  if (!fs.existsSync(localDbPath) && fs.existsSync(sourceDbPath)) {
    fs.copyFileSync(sourceDbPath, localDbPath);
  }
}

async function pullBlobDatabaseIfNeeded() {
  if (!usesBlobPersistence) return false;

  try {
    const metadata = await head(blobPathname, { token: blobToken });

    if (metadata.etag === lastBlobEtag && fs.existsSync(localDbPath)) {
      return false;
    }

    const result = await get(blobPathname, {
      access: 'private',
      token: blobToken,
      useCache: false,
    });

    if (result.statusCode !== 200 || !result.stream) {
      return false;
    }

    const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
    closeConnection();
    ensureLocalDbDirectory();
    fs.writeFileSync(localDbPath, buffer);
    lastBlobEtag = metadata.etag;
    dirty = false;
    return true;
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return false;
    }

    throw error;
  }
}

function applySchemaAndSeed() {
  const db = getConnection();
  let changed = false;
  const demoTenantId = 't1_demo';
  const demoPipelineId = 'p1_demo';
  const demoStageNewId = 's1_demo_new';
  const demoStageServiceId = 's1_demo_service';
  const demoStageClosingId = 's1_demo_closing';
  const masterUserId = 'u1_master';
  const adminUserId = 'u2_demo_admin';
  const agentUserId = 'u3_demo_agent';

  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
  }

  try {
    db.exec("ALTER TABLE leads ADD COLUMN tags TEXT DEFAULT '[]'");
    changed = true;
  } catch {}

  try {
    db.exec("ALTER TABLE leads ADD COLUMN assigned_to TEXT");
    changed = true;
  } catch {}

  try {
    db.exec("ALTER TABLE leads ADD COLUMN owner_user_id TEXT");
    changed = true;
  } catch {}

  try {
    db.exec("ALTER TABLE tenant_settings ADD COLUMN sidebar_color TEXT DEFAULT '#0F172A'");
    changed = true;
  } catch {}

  try {
    db.exec("ALTER TABLE tenant_settings ADD COLUMN sidebar_text_color TEXT DEFAULT '#cbd5e1'");
    changed = true;
  } catch {}

  const phaseOneColumns = [
    "ALTER TABLE tenant_settings ADD COLUMN lead_capture_token TEXT",
    "ALTER TABLE leads ADD COLUMN source_type TEXT DEFAULT 'manual'",
    "ALTER TABLE leads ADD COLUMN source_campaign TEXT",
    "ALTER TABLE leads ADD COLUMN source_page TEXT",
    "ALTER TABLE leads ADD COLUMN source_captured_at DATETIME",
    "ALTER TABLE quick_replies ADD COLUMN category TEXT DEFAULT 'Geral'",
  ];

  for (const statement of phaseOneColumns) {
    try {
      db.exec(statement);
      changed = true;
    } catch {}
  }

  const leadClassificationColumns = [
    "ALTER TABLE leads ADD COLUMN classification TEXT",
    "ALTER TABLE leads ADD COLUMN classification_details TEXT",
    "ALTER TABLE leads ADD COLUMN classified_at DATETIME",
    "ALTER TABLE leads ADD COLUMN classified_by TEXT",
  ];

  for (const statement of leadClassificationColumns) {
    try {
      db.exec(statement);
      changed = true;
    } catch {}
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_leads_tenant_classification
      ON leads(tenant_id, classification);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS lead_source_history (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      lead_id TEXT NOT NULL,
      source TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'manual',
      campaign TEXT,
      source_page TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_capture_token
      ON tenant_settings(lead_capture_token) WHERE lead_capture_token IS NOT NULL;
    UPDATE tenant_settings
      SET lead_capture_token = lower(hex(randomblob(24)))
      WHERE lead_capture_token IS NULL;
  `);

  try {
    db.exec("ALTER TABLE messages ADD COLUMN sender_type TEXT DEFAULT 'user'");
    changed = true;
  } catch {}

  const messagesColumns = [
    "ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'text'",
    "ALTER TABLE messages ADD COLUMN error_code TEXT",
    "ALTER TABLE messages ADD COLUMN error_message TEXT",
    "ALTER TABLE messages ADD COLUMN meta_status_payload TEXT",
    "ALTER TABLE messages ADD COLUMN sent_at DATETIME",
    "ALTER TABLE messages ADD COLUMN delivered_at DATETIME",
    "ALTER TABLE messages ADD COLUMN read_at DATETIME",
  ];

  for (const statement of messagesColumns) {
    try {
      db.exec(statement);
      changed = true;
    } catch {}
  }

  const whatsappConnectionColumns = [
    "ALTER TABLE whatsapp_connections ADD COLUMN onboarding_status TEXT",
    "ALTER TABLE whatsapp_connections ADD COLUMN onboarding_step TEXT",
    "ALTER TABLE whatsapp_connections ADD COLUMN onboarding_error_code TEXT",
    "ALTER TABLE whatsapp_connections ADD COLUMN onboarding_error_message TEXT",
    "ALTER TABLE whatsapp_connections ADD COLUMN meta_business_id TEXT",
    "ALTER TABLE whatsapp_connections ADD COLUMN verified_name TEXT",
    "ALTER TABLE whatsapp_connections ADD COLUMN code_verification_status TEXT",
    "ALTER TABLE whatsapp_connections ADD COLUMN name_status TEXT",
    "ALTER TABLE whatsapp_connections ADD COLUMN quality_rating TEXT",
    "ALTER TABLE whatsapp_connections ADD COLUMN platform_type TEXT",
    "ALTER TABLE whatsapp_connections ADD COLUMN access_token_iv TEXT",
    "ALTER TABLE whatsapp_connections ADD COLUMN access_token_auth_tag TEXT",
    "ALTER TABLE whatsapp_connections ADD COLUMN token_type TEXT",
    "ALTER TABLE whatsapp_connections ADD COLUMN token_expires_at DATETIME",
    "ALTER TABLE whatsapp_connections ADD COLUMN token_last_validated_at DATETIME",
    "ALTER TABLE whatsapp_connections ADD COLUMN webhook_subscribed INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE whatsapp_connections ADD COLUMN app_subscribed_to_waba INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE whatsapp_connections ADD COLUMN phone_registered INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE whatsapp_connections ADD COLUMN onboarding_completed_at DATETIME",
    "ALTER TABLE whatsapp_connections ADD COLUMN last_sync_at DATETIME",
    "ALTER TABLE whatsapp_connections ADD COLUMN last_health_check_at DATETIME",
    "ALTER TABLE whatsapp_connections ADD COLUMN last_health_status TEXT",
    "ALTER TABLE whatsapp_connections ADD COLUMN last_inbound_message_at DATETIME",
    "ALTER TABLE whatsapp_connections ADD COLUMN last_outbound_message_at DATETIME",
    "ALTER TABLE whatsapp_connections ADD COLUMN last_status_message_at DATETIME",
    "ALTER TABLE whatsapp_connections ADD COLUMN last_error_at DATETIME",
    "ALTER TABLE whatsapp_connections ADD COLUMN disconnected_at DATETIME",
    "ALTER TABLE whatsapp_connections ADD COLUMN token_revoked_at DATETIME",
  ];

  for (const statement of whatsappConnectionColumns) {
    try {
      db.exec(statement);
      changed = true;
    } catch {}
  }

  try {
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_phone_number_unique
      ON whatsapp_connections(phone_number_id)
      WHERE phone_number_id IS NOT NULL
    `);
    changed = true;
  } catch {}

  try {
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_external_id_unique
      ON messages(external_message_id)
      WHERE external_message_id IS NOT NULL
    `);
    changed = true;
  } catch {}

  const masterExists = db.prepare('SELECT 1 FROM users WHERE id = ?').get(masterUserId);
  if (!masterExists) {
    const hash = bcrypt.hashSync('master123', 10);
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(masterUserId, 'Master Admin', 'master@crm.com', hash, 'master');
    changed = true;
  }

  const demoTenantExists = db.prepare('SELECT 1 FROM tenants WHERE id = ?').get(demoTenantId);
  if (!demoTenantExists) {
    db.prepare(`
      INSERT INTO tenants (id, name, email, phone, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(demoTenantId, 'CRM Demo', 'contato@crmdemo.com', '(11) 99999-0000', 'active');
    changed = true;
  }

  const demoSettingsExists = db.prepare('SELECT 1 FROM tenant_settings WHERE tenant_id = ?').get(demoTenantId);
  if (!demoSettingsExists) {
    db.prepare(`
      INSERT INTO tenant_settings (tenant_id, company_name, primary_color, sidebar_color, sidebar_text_color, lead_capture_token)
      VALUES (?, ?, ?, ?, ?, lower(hex(randomblob(24))))
    `).run(demoTenantId, 'CRM Demo', '#4f46e5', '#0F172A', '#cbd5e1');
    changed = true;
  }

  const demoPipelineExists = db.prepare('SELECT 1 FROM pipelines WHERE id = ?').get(demoPipelineId);
  if (!demoPipelineExists) {
    db.prepare('INSERT INTO pipelines (id, tenant_id, name) VALUES (?, ?, ?)').run(
      demoPipelineId,
      demoTenantId,
      'Funil de Vendas'
    );
    changed = true;
  }

  const demoStages = [
    { id: demoStageNewId, name: 'Novo Lead', order: 0 },
    { id: demoStageServiceId, name: 'Em Atendimento', order: 1 },
    { id: demoStageClosingId, name: 'Fechamento', order: 2 },
  ];

  for (const stage of demoStages) {
    const stageExists = db.prepare('SELECT 1 FROM pipeline_stages WHERE id = ?').get(stage.id);
    if (!stageExists) {
      db.prepare('INSERT INTO pipeline_stages (id, pipeline_id, name, "order") VALUES (?, ?, ?, ?)').run(
        stage.id,
        demoPipelineId,
        stage.name,
        stage.order
      );
      changed = true;
    }
  }

  const seedUsers = [
    {
      id: adminUserId,
      tenantId: demoTenantId,
      name: 'Admin Cliente',
      email: 'admin@cliente.com',
      password: 'admin123',
      role: 'admin',
    },
    {
      id: agentUserId,
      tenantId: demoTenantId,
      name: 'Atendente Cliente',
      email: 'atendente@cliente.com',
      password: 'atendente123',
      role: 'user',
    },
  ];

  for (const user of seedUsers) {
    const userExists = db.prepare('SELECT 1 FROM users WHERE id = ?').get(user.id);
    if (!userExists) {
      db.prepare(`
        INSERT INTO users (id, tenant_id, name, email, password_hash, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        user.id,
        user.tenantId,
        user.name,
        user.email,
        bcrypt.hashSync(user.password, 10),
        user.role
      );
      changed = true;
    }
  }

  return changed;
}

export async function ensureDatabaseReady() {
  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    ensureLocalDbDirectory();

    const pulledFromBlob = await pullBlobDatabaseIfNeeded();
    if (!pulledFromBlob) {
      copyBundledDatabaseIfNeeded();
    }

    const changed = applySchemaAndSeed();
    if (changed) {
      dirty = true;
      await persistDatabaseIfNeeded();
    }
  })().finally(() => {
    initPromise = null;
  });

  await initPromise;
}

export async function persistDatabaseIfNeeded() {
  if (!usesBlobPersistence || !dirty) {
    return;
  }

  closeConnection();
  ensureLocalDbDirectory();

  const contents = fs.readFileSync(localDbPath);
  await put(blobPathname, contents, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/octet-stream',
    token: blobToken,
  });

  const metadata = await head(blobPathname, { token: blobToken });
  lastBlobEtag = metadata.etag;
  dirty = false;
}

export function markDatabaseDirty() {
  dirty = true;
}

const db = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const value = (getConnection() as any)[prop];
    return typeof value === 'function' ? value.bind(getConnection()) : value;
  },
}) as Database.Database;

export default db;
