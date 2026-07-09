import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

const oldQuery = `    const leadsByStageQuery = \`
      SELECT s.name as stage_name, COUNT(l.id) as count 
      FROM stages s
      LEFT JOIN leads l ON l.stage_id = s.id AND l.\${leadFilter.replace('tenant_id', 'l.tenant_id')}
      WHERE s.tenant_id = ?
      GROUP BY s.id
      ORDER BY s.order_index ASC
    \`;`;

const newQuery = `    const leadsByStageQuery = \`
      SELECT s.name as stage_name, COUNT(l.id) as count 
      FROM pipeline_stages s
      JOIN pipelines p ON s.pipeline_id = p.id
      LEFT JOIN leads l ON l.stage_id = s.id AND l.\${leadFilter.replace('tenant_id', 'l.tenant_id')}
      WHERE p.tenant_id = ?
      GROUP BY s.id
      ORDER BY s."order" ASC
    \`;`;

content = content.replace(oldQuery, newQuery);
fs.writeFileSync('server.ts', content);
