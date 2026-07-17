import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, LoaderCircle, RefreshCcw, ShieldCheck, Smartphone, Unplug } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { fetchApi } from '../../lib/api';

declare global {
  interface Window {
    FB?: {
      init: (config: Record<string, unknown>) => void;
      login: (callback: (response: any) => void, options: Record<string, unknown>) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type MetaConnection = {
  id: string;
  connection_status: string;
  onboarding_status?: string | null;
  onboarding_step?: string | null;
  onboarding_error_code?: string | null;
  onboarding_error_message?: string | null;
  meta_business_id?: string | null;
  waba_id?: string | null;
  phone_number_id?: string | null;
  display_phone_number?: string | null;
  verified_name?: string | null;
  code_verification_status?: string | null;
  name_status?: string | null;
  quality_rating?: string | null;
  webhook_subscribed?: number;
  app_subscribed_to_waba?: number;
  phone_registered?: number;
  connected_at?: string | null;
  last_sync_at?: string | null;
  last_health_check_at?: string | null;
  last_health_status?: string | null;
  last_error_at?: string | null;
};

type MetaStatusResponse = {
  available: boolean;
  connections: MetaConnection[];
};

const sdkUrl = 'https://connect.facebook.net/en_US/sdk.js';

export default function WhatsAppSettings() {
  const [status, setStatus] = useState<MetaStatusResponse | null>(null);
  const [connection, setConnection] = useState<MetaConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [manualMode, setManualMode] = useState(false);

  const healthTone = useMemo<'slate' | 'emerald' | 'amber' | 'rose'>(() => {
    if (!connection) return 'slate';
    if (connection.connection_status === 'connected') return 'emerald';
    if (connection.connection_status === 'connected_warning') return 'amber';
    if (connection.connection_status === 'failed') return 'rose';
    return 'slate';
  }, [connection]);

  const healthClasses = {
    slate: 'bg-slate-100 text-slate-500',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
  } as const;

  useEffect(() => {
    void loadStatus();
  }, []);

  async function loadStatus() {
    setIsLoading(true);
    try {
      const data = await fetchApi('/integrations/meta/status');
      setStatus(data);
      setConnection(data.connections?.[0] || null);
    } catch (error: any) {
      setFeedback(error.message || 'Falha ao carregar a integração.');
    } finally {
      setIsLoading(false);
    }
  }

  async function ensureMetaSdk(appId: string) {
    if (window.FB) {
      window.FB.init({ appId, version: 'v23.0', xfbml: false });
      setSdkReady(true);
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${sdkUrl}"]`) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Falha ao carregar o SDK da Meta.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = sdkUrl;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar o SDK da Meta.'));
      document.body.appendChild(script);
    });

    if (!window.FB) {
      throw new Error('O SDK da Meta não ficou disponível na página.');
    }

    window.FB.init({ appId, version: 'v23.0', xfbml: false });
    setSdkReady(true);
  }

  async function handleMetaConnect(reauthorize = false) {
    setIsBusy(true);
    setFeedback(reauthorize ? 'Preparando nova autorização com a Meta...' : 'Preparando onboarding com a Meta...');
    setTestResult(null);

    try {
      const session = await fetchApi(reauthorize ? '/integrations/meta/reauthorize/start' : '/integrations/meta/signup/start', {
        method: 'POST',
      });

      await ensureMetaSdk(session.appId);

      await new Promise<void>((resolve, reject) => {
        window.FB?.login(async (response: any) => {
          try {
            const code = response?.authResponse?.code;
            if (!code) {
              reject(new Error('O onboarding da Meta foi cancelado ou não retornou um código de autorização.'));
              return;
            }

            await fetchApi('/integrations/meta/signup/complete', {
              method: 'POST',
              body: JSON.stringify({
                code,
                state: session.state,
                sessionInfo: response?.authResponse?.sessionInfo || response?.sessionInfo || {},
              }),
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        }, {
          config_id: session.configId,
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            setup: {},
            sessionInfoVersion: '3',
          },
        });
      });

      setFeedback('Integração concluída. Atualizando o diagnóstico local.');
      await loadStatus();
    } catch (error: any) {
      setFeedback(error.message || 'Não foi possível concluir o onboarding com a Meta.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRefresh() {
    if (!connection) return;
    setIsBusy(true);
    setFeedback('Atualizando status da conexão diretamente na Meta...');
    try {
      await fetchApi('/integrations/meta/status/refresh', { method: 'POST' });
      await loadStatus();
      setFeedback('Status sincronizado com a Meta.');
    } catch (error: any) {
      setFeedback(error.message || 'Falha ao atualizar o status da conexão.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleTest(sendMessage = false) {
    if (!connection) return;
    setIsBusy(true);
    setFeedback(sendMessage ? 'Executando diagnóstico e envio de mensagem de teste...' : 'Executando diagnóstico da conexão...');
    try {
      const result = await fetchApi('/integrations/meta/test', {
        method: 'POST',
        body: JSON.stringify({
          destinationPhone: testPhone,
          sendMessage,
        }),
      });
      setTestResult(result);
      await loadStatus();
      setFeedback('Diagnóstico concluído.');
    } catch (error: any) {
      setFeedback(error.message || 'Falha ao executar o teste da conexão.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDisconnect() {
    if (!connection) return;
    if (!window.confirm('Desconectar a integração da Meta? O histórico será preservado.')) return;

    setIsBusy(true);
    setFeedback('Desconectando a integração...');
    try {
      await fetchApi('/integrations/meta/disconnect', { method: 'POST' });
      await loadStatus();
      setFeedback('Integração desconectada sem apagar o histórico.');
    } catch (error: any) {
      setFeedback(error.message || 'Falha ao desconectar a integração.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleManualConnect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setFeedback('Salvando conexão técnica manual para o MVP...');
    try {
      const form = new FormData(event.currentTarget);
      await fetchApi('/whatsapp/connect', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      event.currentTarget.reset();
      await loadStatus();
      setFeedback('Conexão manual salva. Use essa opção apenas em suporte técnico do MVP.');
    } catch (error: any) {
      setFeedback(error.message || 'Falha ao salvar a conexão manual.');
    } finally {
      setIsBusy(false);
    }
  }

  const diagnosticItems = [
    { label: 'Webhook', value: connection?.webhook_subscribed ? 'Ativo' : 'Pendente' },
    { label: 'App inscrito no WABA', value: connection?.app_subscribed_to_waba ? 'Sim' : 'Não' },
    { label: 'Telefone registrado', value: connection?.phone_registered ? 'Sim' : 'Não' },
    { label: 'Última checagem', value: connection?.last_health_check_at || 'Ainda não executada' },
    { label: 'Última sincronização', value: connection?.last_sync_at || 'Ainda não sincronizada' },
    { label: 'Último erro', value: connection?.onboarding_error_message || 'Nenhum' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Integração WhatsApp / Meta</h1>
          <p className="text-slate-500 mt-1">
            Fluxo oficial de onboarding com a Meta para demonstrar a conexão do MVP e preservar a base para operação posterior.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          {sdkReady ? <ShieldCheck size={16} className="text-emerald-600" /> : <Smartphone size={16} className="text-slate-400" />}
          {sdkReady ? 'SDK da Meta carregado' : 'SDK carregado sob demanda'}
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {feedback}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${healthClasses[healthTone]}`}>
              <Smartphone className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Status da conexão</h2>
              {isLoading ? (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <LoaderCircle size={16} className="animate-spin" /> Carregando estado atual...
                </p>
              ) : connection ? (
                <div className="flex items-center gap-2 text-sm">
                  {connection.connection_status === 'connected' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-amber-500" />}
                  <span className="font-medium text-slate-700">{connection.connection_status}</span>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nenhum número conectado no momento.</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleMetaConnect(false)} disabled={isBusy || isLoading}>
              {isBusy ? <LoaderCircle size={16} className="mr-2 animate-spin" /> : null}
              Conectar com a Meta
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={isBusy || !connection}>
              <RefreshCcw size={16} className="mr-2" /> Atualizar status
            </Button>
          </div>
        </div>

        {!status?.available && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            As variáveis obrigatórias da Meta ainda não estão completas neste ambiente. O fallback manual fica disponível apenas para suporte do MVP.
          </div>
        )}

        {connection ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <InfoCard label="Número conectado" value={connection.display_phone_number || '-'} />
              <InfoCard label="Phone Number ID" value={connection.phone_number_id || '-'} />
              <InfoCard label="WABA ID" value={connection.waba_id || '-'} />
              <InfoCard label="Meta Business ID" value={connection.meta_business_id || '-'} />
              <InfoCard label="Nome verificado" value={connection.verified_name || '-'} />
              <InfoCard label="Qualidade" value={connection.quality_rating || '-'} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Diagnóstico</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {diagnosticItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-medium text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Teste de conexão</h3>
              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <input
                  value={testPhone}
                  onChange={(event) => setTestPhone(event.target.value)}
                  placeholder="Telefone para teste, ex: 5511999999999"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                <Button variant="outline" onClick={() => handleTest(false)} disabled={isBusy}>
                  Diagnosticar
                </Button>
                <Button variant="outline" onClick={() => handleTest(true)} disabled={isBusy || !testPhone}>
                  Enviar teste
                </Button>
              </div>
              {testResult && (
                <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => handleMetaConnect(true)} disabled={isBusy}>
                Reautorizar
              </Button>
              <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleDisconnect} disabled={isBusy}>
                <Unplug size={16} className="mr-2" /> Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-sm text-slate-600">
              Conecte sua conta empresarial da Meta para usar o WhatsApp dentro da plataforma sem copiar manualmente token, WABA ID ou Phone Number ID.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Fallback técnico do MVP</h2>
            <p className="text-sm text-slate-500">
              Use somente quando o app Meta ainda estiver em ajuste. Esse modo preserva a mesma estrutura segura do backend.
            </p>
          </div>
          <Button variant="outline" onClick={() => setManualMode((value) => !value)}>
            {manualMode ? 'Ocultar' : 'Mostrar'} formulário técnico
          </Button>
        </div>

        {manualMode && (
          <form onSubmit={handleManualConnect} className="mt-6 grid gap-4 md:grid-cols-2">
            <input name="phone_number_id" required className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Phone Number ID" />
            <input name="waba_id" required className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="WABA ID" />
            <input name="display_phone_number" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Número de exibição" />
            <input name="access_token" required type="password" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Access Token" />
            <div className="md:col-span-2">
              <Button type="submit" disabled={isBusy}>Salvar conexão manual</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="mt-2 block break-all text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}
