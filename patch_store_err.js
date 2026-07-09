import fs from 'fs';
let content = fs.readFileSync('src/store.ts', 'utf-8');

content = content.replace(
  'console.error("Failed to initialize data:", error);',
  'console.error("Failed to initialize data:", error);\nalert("Erro de inicialização: " + error.message);'
);

fs.writeFileSync('src/store.ts', content);
