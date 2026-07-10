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

  try {
    db.exec("ALTER TABLE messages ADD COLUMN sender_type TEXT DEFAULT 'user'");
    changed = true;
  } catch {}

  const masterExists = db.prepare('SELECT 1 FROM users WHERE role = ?').get('master');
  if (!masterExists) {
    const hash = bcrypt.hashSync('master123', 10);
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('u1_master', 'Master Admin', 'master@crm.com', hash, 'master');
    changed = true;
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
