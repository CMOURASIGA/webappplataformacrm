import fs from 'fs';
let content = fs.readFileSync('src/db/index.ts', 'utf-8');

const updatedDbPath = `
const sourceDb = path.join(process.cwd(), 'data.db');
let dbPath = sourceDb;

// Check if directory is writable
try {
  fs.accessSync(process.cwd(), fs.constants.W_OK);
  // Also check if data.db exists and is writable
  if (fs.existsSync(sourceDb)) {
     fs.accessSync(sourceDb, fs.constants.W_OK);
  }
} catch (e) {
  // Read-only filesystem (like Cloud Run)
  dbPath = '/tmp/data.db';
  if (fs.existsSync(sourceDb) && !fs.existsSync(dbPath)) {
    fs.copyFileSync(sourceDb, dbPath);
  }
}

const db = new Database(dbPath);
`;

content = content.replace("const dbPath = path.join(process.cwd(), 'data.db');\nconst db = new Database(dbPath);", updatedDbPath);
fs.writeFileSync('src/db/index.ts', content);
