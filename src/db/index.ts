import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data.db');
const db = new Database(dbPath);

// Initialize database with schema
const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
}

try {
  db.exec("ALTER TABLE leads ADD COLUMN tags TEXT DEFAULT '[]'");
} catch (e) {
  // column already exists
}

try {
  db.exec("ALTER TABLE tenant_settings ADD COLUMN sidebar_color TEXT DEFAULT '#0F172A'");
  db.exec("ALTER TABLE tenant_settings ADD COLUMN sidebar_text_color TEXT DEFAULT '#cbd5e1'");
} catch (e) {
  // column already exists
}

// Ensure at least one master user exists
const masterExists = db.prepare('SELECT * FROM users WHERE role = ?').get('master');
if (!masterExists) {
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('master123', 10);
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('u1_master', 'Master Admin', 'master@crm.com', hash, 'master');
}

export default db;
