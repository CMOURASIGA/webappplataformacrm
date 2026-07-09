import fs from 'fs';
let content = fs.readFileSync('src/pages/chat/Chat.tsx', 'utf-8');

const newSidebar = `
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="font-bold text-slate-800 mb-4">Conversas</div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button onClick={() => setFilter('minhas')} className={cn("flex-1 text-xs py-1.5 rounded-md font-medium transition-colors", filter === 'minhas' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700')}>Minhas</button>
             <button onClick={() => setFilter('fila')} className={cn("flex-1 text-xs py-1.5 rounded-md font-medium transition-colors", filter === 'fila' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700')}>Fila</button>
             <button onClick={() => setFilter('todas')} className={cn("flex-1 text-xs py-1.5 rounded-md font-medium transition-colors", filter === 'todas' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700')}>Todas</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map(conv => {
            const lead = tenantLeads.find(l => l.id === conv.leadId);
            const isActive = activeConversation?.id === conv.id;
            
            return (
              <div 
                key={conv.id} 
                onClick={() => {
                   if (lead) handleSelectLead(lead.id);
                }}
                className={cn(
                  "p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors bg-white",
                  isActive && "bg-primary-50/50 border-l-4 border-l-primary-600"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                   <div className="font-bold text-sm text-slate-800 truncate pr-2">{lead?.name || 'Desconhecido'}</div>
                   <div className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
                <div className="text-xs text-slate-500 truncate mb-2">{lead?.phone}</div>
                <div className="flex gap-2">
                   <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", 
                     conv.status === 'unassigned' || conv.status === 'new' ? 'bg-amber-100 text-amber-700' :
                     conv.status === 'closed' ? 'bg-slate-100 text-slate-600' :
                     'bg-emerald-100 text-emerald-700'
                   )}>
                     {conv.status === 'unassigned' || conv.status === 'new' ? 'Na Fila' : conv.status === 'closed' ? 'Encerrado' : 'Em Andamento'}
                   </span>
                </div>
              </div>
            );
          })}
          {filteredConversations.length === 0 && (
             <div className="p-8 text-center text-slate-400 text-sm">Nenhuma conversa encontrada.</div>
          )}
        </div>
`;

content = content.replace(/<div className="p-4 border-b border-slate-100 bg-slate-50\/50 font-bold text-slate-800">[\s\S]*?<\/div>[\s\S]*?<div className="flex-1 overflow-y-auto">[\s\S]*?<\/div>\s*<\/div>/m, newSidebar + '\n      </div>');

content = content.replace("export default function Chat() {", "export default function Chat() {\n  const [filter, setFilter] = useState<'minhas' | 'fila' | 'todas'>('minhas');\n");

content = content.replace("const tenantConversations = conversations.filter(c => c.tenantId === currentTenant?.id);", `const tenantConversations = conversations.filter(c => c.tenantId === currentTenant?.id);\n  const filteredConversations = tenantConversations.filter(c => {\n    if (filter === 'minhas') return c.assignedTo === currentUser?.id && c.status !== 'closed';\n    if (filter === 'fila') return !c.assignedTo || c.status === 'unassigned' || c.status === 'new';\n    return true;\n  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());\n`);

fs.writeFileSync('src/pages/chat/Chat.tsx', content);
