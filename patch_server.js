import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf-8');

// Find startServer
const parts = content.split('async function startServer() {');

let beforeStartServer = parts[0];
let startServerBody = parts[1];

// We need to extract the routes from startServerBody and put them before startServer
// The routes are:
// app.get('/api/whatsapp/status'...
// app.post('/api/whatsapp/connect'...
// app.post('/api/whatsapp/disconnect'...
// app.get('/api/meta/webhook'...
// app.post('/api/meta/webhook'...

// They start after app.use((err: any...

const splitPoint = "app.get('/api/whatsapp/status'";
if (startServerBody.includes(splitPoint)) {
    const startBodyParts = startServerBody.split(splitPoint);
    let earlyBody = startBodyParts[0];
    let lateBody = splitPoint + startBodyParts[1];
    
    // lateBody contains app.listen
    const listenSplit = lateBody.split("app.listen(PORT, '0.0.0.0', () => {");
    let routes = listenSplit[0];
    let listenCall = "app.listen(PORT, '0.0.0.0', () => {" + listenSplit[1];

    let newContent = beforeStartServer + '\n\n' + routes + '\n\n' + 
      "app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));\n\n" +
      "async function startServer() {\n" + earlyBody + "\n" + listenCall;
    
    fs.writeFileSync('server.ts', newContent);
    console.log("Patched server.ts");
} else {
    console.log("Could not find routes to split");
}
