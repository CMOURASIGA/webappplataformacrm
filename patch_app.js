import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const importStr = "import Settings from './pages/admin/Settings';";
const newImportStr = importStr + "\nimport AiSettings from './pages/settings/AiSettings';";

const routeStr = '<Route path="settings" element={<Settings />} />';
const newRouteStr = routeStr + '\n          <Route path="settings/ai" element={<AiSettings />} />';

content = content.replace(importStr, newImportStr).replace(routeStr, newRouteStr);

fs.writeFileSync('src/App.tsx', content);
console.log("Patched App.tsx");
