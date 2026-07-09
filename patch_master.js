import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf-8');
const appImportStr = "import Tenants from './pages/master/Tenants';";
const appNewImportStr = appImportStr + "\nimport AiUsage from './pages/master/AiUsage';";
const appRouteStr = '<Route path="master/tenants" element={<Tenants />} />';
const appNewRouteStr = appRouteStr + '\n          <Route path="master/ai-usage" element={<AiUsage />} />';
app = app.replace(appImportStr, appNewImportStr).replace(appRouteStr, appNewRouteStr);
fs.writeFileSync('src/App.tsx', app);

let layout = fs.readFileSync('src/components/layout/AppLayout.tsx', 'utf-8');
const layoutImportStr = "import { cn } from '../../lib/utils';";
const layoutNewImportStr = "import { Sparkles } from 'lucide-react';\n" + layoutImportStr;
const layoutNavStr = `    {
      name: "Tenants (Clientes)",
      href: "/master/tenants",
      icon: <Building2 size={16} />,
    },`;
const layoutNewNavStr = layoutNavStr + `
    {
      name: "Uso de IA",
      href: "/master/ai-usage",
      icon: <Sparkles size={16} />,
    },`;
layout = layout.replace(layoutImportStr, layoutNewImportStr).replace(layoutNavStr, layoutNewNavStr);
fs.writeFileSync('src/components/layout/AppLayout.tsx', layout);
console.log("Patched App.tsx and AppLayout.tsx");
