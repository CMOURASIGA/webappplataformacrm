import fs from 'fs';
let content = fs.readFileSync('src/store.ts', 'utf-8');

const oldAssign = `      assignConversation: (conversationId, userId) => {
        set(state => ({
          conversations: state.conversations.map(c => c.id === conversationId ? { ...c, assignedTo: userId, status: 'in_progress' } : c)
        }));
      },`;

const newAssign = `      assignConversation: async (conversationId, userId) => {
        try {
           await fetchApi(\`/conversations/\${conversationId}/assign\`, {
              method: 'PATCH',
              body: JSON.stringify({ assigned_to: userId })
           });
           set(state => ({
             conversations: state.conversations.map(c => c.id === conversationId ? { ...c, assignedTo: userId, status: 'in_progress' } : c)
           }));
        } catch (e) { console.error("Failed to assign", e); }
      },
      updateConversationStatus: async (conversationId, status, closeReason) => {
        try {
           await fetchApi(\`/conversations/\${conversationId}/status\`, {
              method: 'PATCH',
              body: JSON.stringify({ status, close_reason: closeReason })
           });
           set(state => ({
             conversations: state.conversations.map(c => c.id === conversationId ? { ...c, status } : c)
           }));
        } catch (e) { console.error("Failed to update status", e); }
      },`;

if (content.includes(oldAssign)) {
    content = content.replace(oldAssign, newAssign);
}

// Update the type as well
const oldType = "assignConversation: (conversationId: string, userId: string) => void;";
const newType = "assignConversation: (conversationId: string, userId: string) => Promise<void>;\n  updateConversationStatus: (conversationId: string, status: string, closeReason?: string) => Promise<void>;";

if (content.includes(oldType)) {
    content = content.replace(oldType, newType);
}

fs.writeFileSync('src/store.ts', content);
