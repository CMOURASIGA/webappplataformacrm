import Database from 'better-sqlite3';
const db = new Database('data.db');
try {
  db.exec("UPDATE tenant_settings SET company_name = 'Test' WHERE 1=0;");
  console.log("Success");
} catch (e) {
  console.log("Error:", e);
}
