import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const token = jwt.sign({ id: 'frme341', role: 'admin', tenantId: '0bmj9k2' }, process.env.JWT_SECRET || 'secret');

async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/whatsapp/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Body:', text.substring(0, 100));
    } catch(e) {
        console.error(e.message);
    }
}
test();
