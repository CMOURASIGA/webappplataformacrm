import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// import MasterDashboard
if (!content.includes('import MasterDashboard from')) {
    content = content.replace("import Dashboard from './pages/Dashboard';", "import Dashboard from './pages/Dashboard';\nimport MasterDashboard from './pages/master/Dashboard';");
}

if (!content.includes('<Route path="master/dashboard"')) {
    content = content.replace('<Route path="master/tenants"', '<Route path="master/dashboard" element={<MasterDashboard />} />\n          <Route path="master/tenants"');
}

fs.writeFileSync('src/App.tsx', content);
console.log("Patched App.tsx");
