import fs from 'fs';

let content = fs.readFileSync('src/pages/chat/Chat.tsx', 'utf-8');

const importStr = "import { Send, User as UserIcon, Plus } from 'lucide-react';";
const newImportStr = "import { Send, User as UserIcon, Plus, Sparkles, FileText, Activity } from 'lucide-react';\nimport { fetchApi } from '../../lib/api';";
content = content.replace(importStr, newImportStr);

const stateStr = "  const [text, setText] = useState('');";
const newStateStr = `  const [text, setText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [aiClassification, setAiClassification] = useState<any>(null);

  const handleSuggestReply = async () => {
    if (!activeConversation) return;
    setIsAiLoading(true);
    try {
      const data = await fetchApi('/ai/suggest-reply', {
        method: 'POST',
        body: JSON.stringify({ conversationId: activeConversation.id }),
      });
      if (data.suggestion) {
        setText(text + (text ? ' ' : '') + data.suggestion);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar sugestão. Verifique se a IA está ativada e configurada.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!activeConversation) return;
    setIsAiLoading(true);
    try {
      const data = await fetchApi('/ai/summarize-conversation', {
        method: 'POST',
        body: JSON.stringify({ conversationId: activeConversation.id }),
      });
      setAiSummary(data);
    } catch (err) {
      console.error(err);
      alert('Erro ao resumir conversa.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleClassify = async () => {
    if (!activeLead) return;
    setIsAiLoading(true);
    try {
      const data = await fetchApi('/ai/classify-lead', {
        method: 'POST',
        body: JSON.stringify({ leadId: activeLead.id }),
      });
      setAiClassification(data);
    } catch (err) {
      console.error(err);
      alert('Erro ao classificar lead.');
    } finally {
      setIsAiLoading(false);
    }
  };
`;
content = content.replace(stateStr, newStateStr);

const buttonStr = `<Button variant="outline" size="sm">Encerrar Atendimento</Button>`;
const newButtonStr = `
              <div className="flex items-center gap-2">
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
content = content.replace(buttonStr, newButtonStr);

const aiPanelStr = `                {!activeConversation && (`;
const newAiPanelStr = `                
                {(aiSummary || aiClassification) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-sm text-amber-900 shadow-sm relative">
                    <button onClick={() => { setAiSummary(null); setAiClassification(null); }} className="absolute top-2 right-2 text-amber-500 hover:text-amber-700">✕</button>
                    {aiClassification && (
                      <div className="mb-4">
                        <h4 className="font-bold mb-2 flex items-center gap-1"><Sparkles size={14}/> Classificação de IA</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><strong>Intenção:</strong> <span className="capitalize">{aiClassification.intencao}</span></div>
                          <div><strong>Temperatura:</strong> <span className="capitalize">{aiClassification.temperatura}</span></div>
                          <div><strong>Prioridade:</strong> <span className="capitalize">{aiClassification.prioridade}</span></div>
                          <div><strong>Sentimento:</strong> <span className="capitalize">{aiClassification.sentimento}</span></div>
                        </div>
                        {aiClassification.resumo_comercial && (
                          <div className="mt-2 text-xs"><strong>Resumo:</strong> {aiClassification.resumo_comercial}</div>
                        )}
                        {aiClassification.proxima_acao && (
                          <div className="mt-1 text-xs"><strong>Próxima ação sugerida:</strong> {aiClassification.proxima_acao}</div>
                        )}
                      </div>
                    )}
                    {aiSummary && (
                      <div>
                        <h4 className="font-bold mb-2 flex items-center gap-1"><Sparkles size={14}/> Resumo de IA</h4>
                        <p className="mb-2 text-xs">{aiSummary.resumo}</p>
                        {aiSummary.pontos_importantes?.length > 0 && (
                          <div className="mb-2">
                            <strong className="text-xs">Pontos Importantes:</strong>
                            <ul className="list-disc pl-4 text-xs">
                              {aiSummary.pontos_importantes.map((pt: string, i: number) => <li key={i}>{pt}</li>)}
                            </ul>
                          </div>
                        )}
                        {aiSummary.pendencias?.length > 0 && (
                          <div className="mb-2">
                            <strong className="text-xs">Pendências:</strong>
                            <ul className="list-disc pl-4 text-xs">
                              {aiSummary.pendencias.map((pt: string, i: number) => <li key={i}>{pt}</li>)}
                            </ul>
                          </div>
                        )}
                        {aiSummary.proxima_acao && (
                          <p className="text-xs"><strong>Próxima ação:</strong> {aiSummary.proxima_acao}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {!activeConversation && (`;
content = content.replace(aiPanelStr, newAiPanelStr);

const inputStr = `{quickReplies.map(qr => (`;
const newInputStr = `<button
                        type="button"
                        onClick={handleSuggestReply}
                        disabled={isAiLoading}
                        className="whitespace-nowrap text-[10px] bg-primary-50 text-primary-700 px-2 py-1 rounded border border-primary-200 hover:bg-primary-100 transition-colors flex items-center gap-1 font-semibold"
                      >
                        <Sparkles size={12} /> IA Sugerir
                      </button>
                      {quickReplies.map(qr => (`;
content = content.replace(inputStr, newInputStr);

fs.writeFileSync('src/pages/chat/Chat.tsx', content);
console.log("Patched Chat.tsx");
