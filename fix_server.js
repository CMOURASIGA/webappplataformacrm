import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf-8');

const startServerBlockRegex = /async function startServer\(\) \{[\s\S]*?startServer\(\);\n/m;
const match = content.match(startServerBlockRegex);

if (match) {
    let block = match[0];
    content = content.replace(block, '');
    content += '\n\n' + block;
    fs.writeFileSync('server.ts', content);
    console.log("Moved startServer to bottom");
} else {
    console.log("Could not find startServer block");
}
