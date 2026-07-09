import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('import Users')) {
   content = content.replace(
     "import Settings from './pages/admin/Settings';",
     "import Settings from './pages/admin/Settings';\nimport Users from './pages/admin/Users';"
   );
   content = content.replace(
     '<Route path="settings" element={<Settings />} />',
     '<Route path="settings" element={<Settings />} />\n          <Route path="users" element={<Users />} />'
   );
   fs.writeFileSync('src/App.tsx', content);
}
