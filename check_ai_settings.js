import Database from 'better-sqlite3';
const db = new Database('data.db');
console.log(db.prepare('SELECT * FROM ai_settings').all());
