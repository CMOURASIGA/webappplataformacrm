import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const token = jwt.sign({ id: 'u1_master', role: 'master', tenantId: null }, process.env.JWT_SECRET || 'secret');

const endpoints = ['/tenant/settings', '/pipelines', '/leads', '/conversations', '/tags', '/quick-replies'];

async function test() {
  for (const ep of endpoints) {
    try {
        const res = await fetch('http://localhost:3000/api' + ep, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Tenant-ID': '0bmj9k2'
          }
        });
        const text = await res.text();
        console.log(ep, res.status, text.substring(0, 100));
    } catch(e) {
        console.error(ep, e.message);
    }
  }
}
test();
