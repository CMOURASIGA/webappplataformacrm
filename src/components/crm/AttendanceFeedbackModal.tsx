import { Download, Sparkles, X } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { Button } from '../ui/Button';

export interface AttendanceFeedback {
  id: string;
  conversationId: string;
  closureOrigin: 'manual' | 'automatic';
  conversationClosedAt: string;
  closeReason?: string | null;
  model: string;
  summary: string;
  positivePoints: string[];
  improvementPoints: string[];
  deviations: string[];
  recommendations: string[];
  score?: unknown;
  generatedAt: string;
}

function printable(value: unknown) {
  if (value == null) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function escapeHtml(value: unknown) {
  return printable(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function listHtml(title: string, items: string[]) {
  if (!items.length) return '';
  return `<section><h2>${escapeHtml(title)}</h2><ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`;
}

function FeedbackList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className={`mb-2 text-xs font-bold uppercase tracking-wider ${tone}`}>{title}</h3>
      <ul className="space-y-2 text-sm text-slate-700">
        {items.map((item, index) => <li key={`${title}-${index}`} className="rounded-lg bg-slate-50 px-3 py-2">{item}</li>)}
      </ul>
    </section>
  );
}

export function AttendanceFeedbackModal({ feedback, leadName, markDismissedOnClose = false, onAction, onClose }: { feedback: AttendanceFeedback; leadName: string; markDismissedOnClose?: boolean; onAction?: (action: 'dismissed' | 'pdf_exported') => Promise<void> | void; onClose: () => void }) {
  const recordAction = async (action: 'dismissed' | 'pdf_exported') => {
    if (onAction) return onAction(action);
    await fetchApi(`/attendance-feedback/${feedback.id}/action`, { method: 'POST', body: JSON.stringify({ action }) });
  };

  const close = async () => {
    if (markDismissedOnClose) {
      await recordAction('dismissed').catch(() => undefined);
    }
    onClose();
  };

  const savePdf = async () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('O navegador bloqueou a janela de impressao. Permita pop-ups para salvar o PDF.');
      return;
    }
    printWindow.opener = null;
    await recordAction('pdf_exported').catch(() => undefined);
    const score = feedback.score == null ? '' : `<div class="score"><strong>Nota:</strong> ${escapeHtml(feedback.score)}</div>`;
    printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Feedback de atendimento - ${escapeHtml(leadName)}</title><style>
      @page { margin: 18mm; } body { color:#172033; font-family: Georgia, serif; font-size:12pt; line-height:1.5; margin:0; }
      header { border-bottom:3px solid #0f766e; margin-bottom:24px; padding-bottom:16px; } h1 { font-size:22pt; margin:0 0 6px; } h2 { color:#0f766e; font-size:13pt; margin:22px 0 8px; }
      .meta { color:#64748b; font-family: sans-serif; font-size:9pt; } .summary { background:#f0fdfa; border-left:4px solid #0f766e; padding:14px; }
      .score { border:1px solid #cbd5e1; display:inline-block; margin-top:12px; padding:8px 12px; } li { margin-bottom:6px; }
    </style></head><body><header><h1>Feedback de atendimento</h1><div class="meta">Cliente: ${escapeHtml(leadName)} | Encerrado em: ${escapeHtml(new Date(feedback.conversationClosedAt).toLocaleString('pt-BR'))} | Origem: ${feedback.closureOrigin === 'automatic' ? 'automatica' : 'manual'}</div></header>
      <section><h2>Resumo</h2><div class="summary">${escapeHtml(feedback.summary)}</div>${score}</section>
      ${listHtml('Pontos positivos', feedback.positivePoints)}${listHtml('Pontos a melhorar', feedback.improvementPoints)}${listHtml('Desvios identificados', feedback.deviations)}${listHtml('Recomendacoes', feedback.recommendations)}
      <section><h2>Informacoes tecnicas</h2><div class="meta">Gerado em ${escapeHtml(new Date(feedback.generatedAt).toLocaleString('pt-BR'))} pelo modelo ${escapeHtml(feedback.model)}.</div></section>
    </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="attendance-feedback-title">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-teal-950 to-slate-900 px-6 py-5 text-white">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-200"><Sparkles size={15} /> Analise de qualidade</div>
            <h2 id="attendance-feedback-title" className="text-xl font-bold">Feedback do atendimento</h2>
            <p className="mt-1 text-sm text-slate-300">{leadName} | encerramento {feedback.closureOrigin === 'automatic' ? 'automatico' : 'manual'}</p>
          </div>
          <button onClick={close} aria-label="Fechar feedback" className="rounded-full p-2 text-slate-300 hover:bg-white/10 hover:text-white"><X size={20} /></button>
        </header>

        <div className="space-y-6 overflow-y-auto px-6 py-5">
          <section className="rounded-xl border border-teal-100 bg-teal-50 p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-teal-800">Resumo</h3>
            <p className="text-sm leading-6 text-slate-800">{feedback.summary}</p>
            {feedback.score != null && <div className="mt-3 inline-flex rounded-full border border-teal-200 bg-white px-3 py-1 text-sm font-bold text-teal-900">Nota: {printable(feedback.score)}</div>}
          </section>
          <div className="grid gap-6 md:grid-cols-2">
            <FeedbackList title="Pontos positivos" items={feedback.positivePoints} tone="text-emerald-700" />
            <FeedbackList title="Pontos a melhorar" items={feedback.improvementPoints} tone="text-amber-700" />
            <FeedbackList title="Desvios identificados" items={feedback.deviations} tone="text-rose-700" />
            <FeedbackList title="Recomendacoes" items={feedback.recommendations} tone="text-sky-700" />
          </div>
          <p className="text-xs text-slate-400">Analise gerada por IA. Use o resultado como apoio e considere o contexto completo do atendimento.</p>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={savePdf}><Download size={15} className="mr-2" /> Salvar PDF</Button>
        </footer>
      </div>
    </div>
  );
}
