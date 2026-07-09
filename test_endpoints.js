import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const token = jwt.sign({ id: 'frme341', role: 'admin', tenantId: '0bmj9k2' }, process.env.JWT_SECRET || 'secret');

fetch('http://localhost:3000/api/tenant/settings', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.text().then(t => console.log(r.status, t)))
.catch(e => console.error(e.message));
