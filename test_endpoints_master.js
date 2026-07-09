import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const token = jwt.sign({ id: 'u1_master', role: 'master', tenantId: null }, process.env.JWT_SECRET || 'secret');

async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/admin/tenants', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const text = await res.text();
        console.log(res.status, text.substring(0, 100));
    } catch(e) {
        console.error(e.message);
    }
}
test();
