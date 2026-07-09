import fs from 'fs';

let content = fs.readFileSync('src/db/index.ts', 'utf-8');

const newAlter = `
try {
  db.exec("ALTER TABLE messages ADD COLUMN sender_type TEXT DEFAULT 'user'");
} catch (e) {}
`;

if (!content.includes('messages ADD COLUMN sender_type')) {
  content = content.replace('// Ensure at least one master user exists', newAlter + '\n// Ensure at least one master user exists');
  fs.writeFileSync('src/db/index.ts', content);
}
