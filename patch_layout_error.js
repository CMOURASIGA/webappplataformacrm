import fs from 'fs';

let content = fs.readFileSync('src/components/layout/AppLayout.tsx', 'utf-8');

if (!content.includes('initError')) {
    content = content.replace('isInitialized,', 'isInitialized,\n    initError,\n    logout,');
    
    // fix logout already exists in destructured variables: it's already there
    // wait, I might have added duplicate logout
    content = content.replace('initError,\n    logout,\n    initializeData,\n    logout,', 'initError,\n    initializeData,\n    logout,');

    content = content.replace('if (!isInitialized) {', `if (initError) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 gap-4">
        <p className="text-red-500 font-bold">Erro ao carregar dados: {initError}</p>
        <button onClick={logout} className="px-4 py-2 bg-slate-200 rounded">Sair</button>
      </div>
    );
  }
  if (!isInitialized) {`);
    
    fs.writeFileSync('src/components/layout/AppLayout.tsx', content);
}
