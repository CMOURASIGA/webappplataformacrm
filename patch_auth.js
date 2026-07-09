import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

const updatedAuth = `
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verify user still exists in database
    const user = db.prepare('SELECT id, role, tenant_id FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    
    req.user = decoded;
    
    // Master impersonation logic: if master provides a tenant ID header, use it
    if (req.user.role === 'master' && req.headers['x-tenant-id']) {
      req.user.tenantId = req.headers['x-tenant-id'];
    }
    
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
`;

content = content.replace(/const authenticate = \(req: any, res: any, next: any\) => \{[\s\S]*?res\.status\(401\)\.json\(\{ error: 'Invalid token' \}\);\n  \}\n\};\n/m, updatedAuth.trim() + '\n\n');
fs.writeFileSync('server.ts', content);
