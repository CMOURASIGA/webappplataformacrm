import fs from 'fs';
let content = fs.readFileSync('src/pages/chat/Chat.tsx', 'utf-8');

const oldQuickReplies = `{quickReplies.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                        type="button"
                        onClick={handleSuggestReply}
                        disabled={isAiLoading}
                        className="whitespace-nowrap text-[10px] bg-primary-50 text-primary-700 px-2 py-1 rounded border border-primary-200 hover:bg-primary-100 transition-colors flex items-center gap-1 font-semibold"
                      >
                        <Sparkles size={12} /> IA Sugerir
                      </button>
                      {quickReplies.map(qr => (
                      <button
                        key={qr.id}
                        type="button"
                        onClick={() => setText(qr.text)}
                        className="whitespace-nowrap text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                      >
                        {qr.title}
                      </button>
                    ))}
                  </div>
                )}`;

const newQuickReplies = `                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                        type="button"
                        onClick={handleSuggestReply}
                        disabled={isAiLoading}
                        className="whitespace-nowrap text-[10px] bg-primary-50 text-primary-700 px-2 py-1 rounded border border-primary-200 hover:bg-primary-100 transition-colors flex items-center gap-1 font-semibold"
                      >
                        <Sparkles size={12} /> IA Sugerir
                      </button>
                    {quickReplies.length > 0 && quickReplies.map(qr => (
                      <button
                        key={qr.id}
                        type="button"
                        onClick={() => setText(qr.text)}
                        className="whitespace-nowrap text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                      >
                        {qr.title}
                      </button>
                    ))}
                  </div>`;

if (content.includes('{quickReplies.length > 0 && (')) {
    content = content.replace(oldQuickReplies, newQuickReplies);
}

fs.writeFileSync('src/pages/chat/Chat.tsx', content);
