import fs from 'fs';
let content = fs.readFileSync('src/pages/chat/Chat.tsx', 'utf-8');

const storeVars = `  const addMessage = useStore(state => state.addMessage);`;
const newStoreVars = `  const addMessage = useStore(state => state.addMessage);
  const assignConversation = useStore(state => state.assignConversation);
  const updateConversationStatus = useStore(state => state.updateConversationStatus);`;
content = content.replace(storeVars, newStoreVars);

const oldButtons = `              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleClassify} disabled={isAiLoading}>
                  <Activity size={14} className="mr-1" />
                  Classificar Lead
                </Button>
                <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isAiLoading}>
                  <FileText size={14} className="mr-1" />
                  Resumir
                </Button>
                <Button variant="outline" size="sm">Encerrar</Button>
              </div>`;

const newButtons = `              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleClassify} disabled={isAiLoading}>
                  <Activity size={14} className="mr-1" />
                  Classificar Lead
                </Button>
                <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isAiLoading}>
                  <FileText size={14} className="mr-1" />
                  Resumir
                </Button>
                
                {activeConversation && (!activeConversation.assignedTo || activeConversation.status === 'unassigned' || activeConversation.status === 'new') && (
                   <Button variant="outline" size="sm" onClick={() => assignConversation(activeConversation.id, currentUser!.id)}>
                     Assumir
                   </Button>
                )}
                {activeConversation && activeConversation.status !== 'closed' && (
                   <Button variant="outline" size="sm" onClick={() => updateConversationStatus(activeConversation.id, 'closed', 'Resolvido')}>
                     Encerrar
                   </Button>
                )}
                {activeConversation && activeConversation.status === 'closed' && (
                   <Button variant="outline" size="sm" onClick={() => updateConversationStatus(activeConversation.id, 'reopened', '')}>
                     Reabrir
                   </Button>
                )}
              </div>`;

content = content.replace(oldButtons, newButtons);
fs.writeFileSync('src/pages/chat/Chat.tsx', content);
