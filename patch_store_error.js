import fs from 'fs';

let content = fs.readFileSync('src/store.ts', 'utf-8');

if (!content.includes('initError: string | null;')) {
    content = content.replace('isInitialized: boolean;', 'isInitialized: boolean;\n  initError: string | null;');
    content = content.replace('isInitialized: false,', 'isInitialized: false,\n      initError: null,');
    
    // reset initError
    content = content.replace('set({ activeTenantId: id, isInitialized: false });', 'set({ activeTenantId: id, isInitialized: false, initError: null });');
    
    // set initError
    content = content.replace('console.error("Failed to initialize data:", error);', 'console.error("Failed to initialize data:", error);\n          set({ initError: error.message });');
    
    fs.writeFileSync('src/store.ts', content);
}
