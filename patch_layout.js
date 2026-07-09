import fs from 'fs';
let content = fs.readFileSync('src/components/layout/AppLayout.tsx', 'utf-8');

if (!content.includes('to="/app/users"')) {
   content = content.replace(
     '<Link to="/app/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">',
     `<Link to="/app/users" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              <Users size={20} />
              <span className="font-medium text-sm">Equipe</span>
            </Link>
            <Link to="/app/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">`
   );
   fs.writeFileSync('src/components/layout/AppLayout.tsx', content);
}
