import Database from 'better-sqlite3';
const db = new Database('data.db');
try {
  db.exec("ALTER TABLE messages ADD COLUMN sender_type TEXT DEFAULT 'user'");
  console.log("Added sender_type column");
} catch (e) {
  console.log("Error:", e.message);
}
