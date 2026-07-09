import fs from 'fs';
let content = fs.readFileSync('src/pages/chat/Chat.tsx', 'utf-8');

content = content.replace(
  "const tenantConversations = conversations.filter(c => c.tenantId === tenantId);",
  `const tenantConversations = conversations.filter(c => c.tenantId === tenantId);
  const filteredConversations = tenantConversations.filter(c => {
    if (filter === 'minhas') return c.assignedTo === currentUser?.id && c.status !== 'closed';
    if (filter === 'fila') return !c.assignedTo || c.status === 'unassigned' || c.status === 'new';
    return true;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());`
);

fs.writeFileSync('src/pages/chat/Chat.tsx', content);
