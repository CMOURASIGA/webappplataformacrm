import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('import KnowledgeBase')) {
   content = content.replace(
     "import Users from './pages/admin/Users';",
     "import Users from './pages/admin/Users';\nimport KnowledgeBase from './pages/settings/KnowledgeBase';"
   );
   content = content.replace(
     '<Route path="users" element={<Users />} />',
     '<Route path="users" element={<Users />} />\n          <Route path="knowledge" element={<KnowledgeBase />} />'
   );
   fs.writeFileSync('src/App.tsx', content);
}

let layout = fs.readFileSync('src/components/layout/AppLayout.tsx', 'utf-8');
if (!layout.includes('to="/app/knowledge"')) {
   layout = layout.replace(
     '<Link to="/app/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">',
     `<Link to="/app/knowledge" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              <Book size={20} />
              <span className="font-medium text-sm">Base Conhecimento</span>
            </Link>
            <Link to="/app/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">`
   );
   if (!layout.includes('Book')) {
       layout = layout.replace('import { Sparkles }', 'import { Sparkles, Book }');
   }
   fs.writeFileSync('src/components/layout/AppLayout.tsx', layout);
}
