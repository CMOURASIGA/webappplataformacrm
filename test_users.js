import jwt from 'jsonwebtoken';
import 'dotenv/config';
const JWT_SECRET = process.env.JWT_SECRET;
const token = jwt.sign({ id: 'u1_master', role: 'master', tenantId: null }, JWT_SECRET, { expiresIn: '24h' });
console.log("TOKEN:", token);
