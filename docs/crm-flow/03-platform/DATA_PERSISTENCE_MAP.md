# CRM Flow - Mapa de Persistência de Dados

## 1. Objetivo

Registrar, para cada informação relevante do relacionamento com o lead, se ela é
realmente persistida pelo backend ou se existe apenas como estado de sessão no
frontend (Zustand/browser). Este levantamento foi feito durante a Fase 5
(Lead Workspace) ao constatar que partes do CRM já pareciam funcionalidades
reais para o usuário sem de fato sobreviver a um reload.

Regra adotada a partir daqui: **se parece registro operacional de CRM, precisa
ser persistente**. Onde não for, a UI deve deixar de apresentar aquela
estrutura como funcionalidade oficial, mesmo que o código continue existindo
por compatibilidade.

## 2. Método

Levantamento feito direto nas três camadas, não a partir do que a tela já
mostrava:

- **Banco**: `src/db/schema.sql` + migrações incrementais em `src/db/index.ts`.
- **API**: rotas em `server.ts`.
- **Frontend**: `src/store.ts` (o que efetivamente chama `fetchApi` vs. o que só
  faz `set()` local) e onde cada dado é consumido em `src/pages` /
  `src/components`.

## 3. Mapa

| Feature | Store (Zustand) | API | Banco | Persistência | Status |
|---|---|---|---|---|---|
| Dados cadastrais (nome, telefone, email, empresa) | `leads` | `GET/POST/PATCH /api/leads` | `leads.name/phone/email/company` | **Real** | Em uso |
| Origem (source/sourceType) | `leads` | `PATCH /api/leads/:id` | `leads.source`, `leads.source_type` | **Real** | Em uso |
| Etapa (stageId) | `leads` | `PATCH /api/leads/:id`, `moveLead` | `leads.stage_id` | **Real** | Em uso (Kanban); exibida no cabeçalho do Lead Workspace desde a Fase 5 |
| Responsável (assignedTo) | `leads` (`mapLead`) | lido via `GET /api/leads` (`assigned_to`) | `leads.assigned_to` | **Real** | Lido desde a Fase 4 (card Kanban); **sem UI de atribuição** — nunca é escrito pelo frontend hoje |
| Tags | `leads` | `PATCH /api/leads/:id` | `leads.tags` (JSON) | **Real** | Em uso |
| Classificação (frio/morno/quente) | `leads` | `PATCH /api/leads/:id` | `leads.classification` | **Real** | Em uso |
| `classificationDetails` / `classifiedBy` / `classifiedAt` | `leads` | mesma rota | `leads.classification_details/classified_by/classified_at` | **Real** | Nunca exibidos na UI até a Fase 5 |
| Notas (`lead.notes`) | `leads` | `PATCH /api/leads/:id` | `leads.notes` | **Real** | Editável com segurança — uma das poucas áreas de registro manual persistente hoje |
| Conversa/mensagens | `conversations`, `messages` | `POST /api/conversations`, `GET /api/conversations`, `GET /api/conversations/:id/messages`, `POST .../messages` | `conversations`, `messages` | **Real** | Em uso |
| **Histórico de origem** | não estava no store | `GET /api/leads/:id/source-history` | `lead_source_history` | **Real** | Rota e tabela existiam, **nunca eram chamadas pelo frontend** antes da Fase 5 |
| `lead.history` ("Histórico de atendimento") | `addLeadHistory` | nenhuma | nenhuma | **Sessão/local** | Não promovido como histórico oficial no Lead Workspace (Fase 5). Estrutura mantida no store por compatibilidade. |
| `lead.attachments` (Anexos) | `addLeadAttachment` / `removeLeadAttachment` | nenhuma | nenhuma | **Sessão/local** | Somente leitura desde a Fase 4; nenhuma operação de adicionar/remover oferecida na UI |
| Discussão interna (`internalChannels` / `internalMessages`) | `createInternalChannel` / `addInternalMessage` (assinatura `async`, mas só `set()` — nunca chama `fetchApi`) | nenhuma | nenhuma | **Sessão/local** | Não apresentada como funcionalidade oficial no Lead Workspace (Fase 5). Vale também para a página "Chat interno" isolada, que usa o mesmo estado — fora do escopo desta fase. |
| Atividades / tarefas do lead | não existe no store | nenhuma rota `/api/tasks` | tabela `tasks` existe (`lead_id`, `due_at`, `status`, `priority`, ...) | **Tabela pronta, sem API nem store** | Não implementado. A existência da tabela não caracteriza a feature como pronta. Gap de produto para priorização futura (não é frontend). |
| Badge "Requer atenção" (`attentionSince` + automação `stage_idle`) | `automations` (seed fixo) + `lead.attentionSince` | nenhuma | **nenhuma coluna `attention_since` no schema** | **Inerte em produção** | O campo nunca é enviado pela API real — o badge só aparece no ambiente `demo/localstorage`, que tem seed próprio. No app real (API-backed) esse comportamento nunca dispara hoje. |
| Regras de automação (Configurações → Automações) | `saveAutomation` / `deleteAutomation` — só `set()`, seed fixo (`defaultAutomations`) | nenhuma | nenhuma | **Sessão/local** | Qualquer edição feita em Configurações → Automações se perde ao recarregar a página. Fora do escopo de frontend desta fase; registrado aqui como prioridade alta de backlog técnico. |
| Resumo de IA do atendimento (`handleSummarize`, Chat) | nenhum (estado local do componente `aiSummary`/`summarizedMessageIds`) | `POST /mvp/ai` (só gera o texto, não grava nada) | nenhuma | **Sessão/local** | Fase 6: parou de gravar em `lead.history` via `addLeadHistory` (ver §4.8). O resumo gerado só existe enquanto a conversa está aberta; recarregar a página perde o resumo e o controle de quais mensagens já foram resumidas. |
| Feedback de atendimento (`AttendanceFeedbackModal`) | não usa o store — `localStorage` direto (`ATTENDANCE_FEEDBACK_STORAGE_KEY = 'crm-attendance-feedbacks'`, funções `storedAttendanceFeedbacks`/`saveAttendanceFeedback`/`attendanceFeedbackSettings` em `Chat.tsx`) | `POST /mvp/ai` (só gera o texto do feedback) | nenhuma | **Local (localStorage do navegador)** | Identificado na revisão da Fase 6. Sobrevive a reload (ao contrário do resto desta tabela, que é só Zustand em memória), mas é por navegador/dispositivo — não sincroniza entre atendentes nem aparece em nenhum relatório real. Não corrigido nesta fase (fora de escopo, ver `MIGRATION_PLAN.md` Fase 6); registrado aqui para avaliação futura. |
| Configurações de IA da tela `/settings/ai` (`AiSettings.tsx`) | não usa o store — `localStorage` direto (`crm-ai-settings`) | nenhuma (existe `/api/ai/settings`, real e já usado pelo fluxo de feedback de atendimento, mas esta tela não chama essa rota) | nenhuma | **Local (localStorage do navegador)** | Identificado na revisão pós-Fase 6.5. Tela inteira nunca foi migrada para a API real — inclusive tinha texto de aviso ("ambiente demonstrativo") e um default de contexto ("Horizonte Empreendimentos", nome de tenant do `demo/localstorage`) vazando de código antigo. Corrigido só o texto nesta rodada (ver `MIGRATION_PLAN.md`); a tela continuar sem persistência real é um gap maior, registrado aqui para priorização futura — provavelmente deveria consumir a mesma `/api/ai/settings` que `attendance_feedback_*` já usa. |

## 4. Decisões tomadas a partir deste mapa (Fase 5 — Lead Workspace)

1. **Histórico de origem** (`lead_source_history`) passou a ser consumido pelo
   Lead Workspace via `GET /api/leads/:id/source-history` (rota já existente,
   nenhuma API nova) e é rotulado explicitamente como **"Histórico de
   origem"** — não como "Histórico" genérico — porque representa apenas
   mudanças de canal/origem, não o relacionamento completo com o lead.
2. **`lead.history`** deixou de ser apresentado como histórico oficial no
   Lead Workspace. A estrutura permanece no store por compatibilidade, mas
   não é mais uma aba/seção da nova experiência.
3. **Discussão interna** (`internalChannels`/`internalMessages`) deixou de ser
   apresentada como funcionalidade oficial no Lead Workspace, pelo mesmo
   motivo. A página "Chat interno" isolada não foi alterada nesta fase.
4. **Anexos** seguem somente leitura (decisão da Fase 4), sem nenhuma
   operação nova.
5. **Etapa** e **Responsável** passaram a ser exibidos com destaque no
   contexto principal do Lead Workspace (cabeçalho), mesmo sem nenhuma nova
   operação de atribuição — ambos são dados reais e já existentes.
6. **Notas** (`lead.notes`) ganhou uma aba própria e editável no Workspace,
   por ser um dos poucos pontos de registro manual com persistência real
   confirmada hoje.
7. **Tasks/atividades** e **automações** não foram implementadas ou
   corrigidas nesta fase — permanecem registradas aqui como dívidas.

## 4.1 Decisões tomadas a partir deste mapa (Fase 6 — Atendimento integrado)

8. **`handleSummarize` (resumo de IA do atendimento) parou de usar
   `lead.history` como se fosse persistência real.** Antes, o Chat lia
   `activeLead.history` para saber quais mensagens já tinham sido
   resumidas e chamava `addLeadHistory(...)` para gravar o resumo como
   "Resumo do atendimento" — tratando uma estrutura de sessão como
   histórico oficial do relacionamento. Agora: o resumo gerado pela IA
   continua disponível na sessão (estado local do componente), o
   controle de "mensagens já resumidas" usa um `Set` local por sessão
   (`summarizedMessageIds`, zerado a cada troca de lead), e nada é mais
   gravado em `lead.history`. Nenhuma API nova foi criada. A estrutura
   `addLeadHistory` continua existindo em `store.ts` por compatibilidade,
   apenas não é mais chamada por este fluxo.

## 5. Backlog técnico identificado

- **Prioridade alta**: persistência de regras de automação
  (Configurações → Automações). Hoje o usuário configura algo pela tela
  acreditando que vai continuar valendo, e isso se perde no primeiro reload —
  mesmo problema de falsa persistência que motivou este documento.
- **Prioridade média**: decidir o destino de `lead.history` e da discussão
  interna — implementar persistência real (API + tabela) antes de
  promovê-los novamente na UI, ou descontinuar essas estruturas.
- **Prioridade média**: anexos de lead — hoje não existe tabela nem rota;
  decisão de produto sobre se e como implementar upload/armazenamento real.
- **Prioridade a definir**: ativar a tabela `tasks` já existente no schema
  com API e UI, se "próxima atividade"/tarefas do lead forem priorizadas.
- **Observação**: o badge "Requer atenção" do Kanban depende de um campo
  (`attentionSince`) que a API nunca envia — hoje é efetivamente um recurso
  morto em produção, ativo apenas no ambiente de demonstração.
- **Prioridade média**: resumo/histórico persistente de atendimento. Hoje
  o resumo gerado por IA (`handleSummarize`, Chat) só existe na sessão do
  navegador — útil como apoio imediato ao atendente, mas não vira um
  registro consultável depois. Se o produto quiser um "histórico de
  atendimento" de verdade, precisa de tabela + API próprias (não
  reaproveitar `lead.history`), com o mesmo cuidado deste documento: só
  promover como funcionalidade oficial o que for realmente persistido.
- **Prioridade a avaliar**: feedback de atendimento (`AttendanceFeedbackModal`)
  grava em `localStorage` do navegador em vez de no backend. Sobrevive a
  reload, mas é local por dispositivo/atendente — não aparece em nenhum
  relatório real nem sincroniza entre quem atende o mesmo lead em
  dispositivos diferentes. Identificado na revisão da Fase 6; não corrigido
  (fora de escopo) — decisão de produto pendente sobre persistir via API.
