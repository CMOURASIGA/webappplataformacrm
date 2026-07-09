import fs from 'fs';

let lines = fs.readFileSync('server.ts', 'utf-8').split('\n');
let dashboardStart = lines.findIndex(l => l.includes('// Dashboard Endpoints'));
let dashboardEnd = lines.findIndex(l => l.includes('app.get(\'/api/health\''));

if (dashboardStart !== -1 && dashboardEnd !== -1 && dashboardStart < dashboardEnd) {
    let dashboardBlock = lines.splice(dashboardStart, dashboardEnd - dashboardStart);
    
    // Find where authenticate is defined
    let authLine = lines.findIndex(l => l.includes('const authenticate ='));
    let authEndLine = lines.findIndex((l, i) => i > authLine && l === '};');
    
    if (authEndLine !== -1) {
        lines.splice(authEndLine + 1, 0, ...dashboardBlock);
        fs.writeFileSync('server.ts', lines.join('\n'));
        console.log('Moved dashboard endpoints below authenticate.');
    } else {
        console.log('Could not find end of authenticate.');
    }
} else {
    console.log('Could not find dashboard block.');
}
