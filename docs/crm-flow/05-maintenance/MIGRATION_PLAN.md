# CRM Flow - Plano de Manutencao e Migracao Visual

## 1. Objetivo

Executar a evolucao do CRM Flow por etapas controladas, evitando refatoracao ampla simultanea e reduzindo risco de regressao funcional.

## 2. Estrategia

A manutencao deve ocorrer por camadas.

Primeiro consolidar componentes e layout. Depois migrar telas criticas. Em seguida integrar melhor os dominios funcionais. Somente depois avancar em IA e refinamentos.

## 3. Fase 1 - Fundacao de UI

Entregas:

- tokens de design;
- Button e variantes;
- Card;
- KPI Card;
- Page Header;
- Modal;
- Drawer;
- Table;
- Search Field;
- Filter Bar;
- Empty State;
- Loading State;
- Error State;
- Permission State;
- Tooltip;
- Dropdown Menu;
- Sidebar reutilizavel;
- Header reutilizavel.

Criterio de saida:

Nenhuma nova tela deve precisar criar um padrao visual paralelo para esses elementos.

## 4. Fase 2 - App Shell e navegacao

Entregas:

- sidebar expandida/recolhida;
- mobile drawer;
- item ativo consistente;
- tooltip na sidebar recolhida;
- header contextual;
- breadcrumb quando aplicavel;
- menu do usuario;
- manutencao das regras de perfil existentes.

Criterio de saida:

Todas as rotas atuais continuam acessiveis pelos perfis autorizados.

## 5. Fase 3 - Dashboard

Entregas:

- migrar Dashboard para componentes oficiais;
- reorganizar KPIs;
- manter links de cards para operacao;
- padronizar graficos;
- incluir estados loading/error/empty;
- preservar diferencas Admin x Atendente.

## 6. Fase 4 - Leads e Kanban

### Lista de Leads

- busca;
- filtros;
- tabela padronizada;
- estados UX;
- abertura do Lead Workspace.

### Kanban

- novo Page Header;
- melhoria visual das colunas;
- melhoria do Lead Card;
- preservacao de drag and drop;
- abertura do Lead Workspace;
- comportamento mobile definido.

## 7. Fase 5 - Lead Workspace

Criar drawer amplo reutilizavel.

Primeira versao:

- Resumo;
- Conversas;
- Atividades;
- Historico.

Preservar a capacidade atual de conversar a partir do lead.

## 8. Fase 6 - Atendimento integrado

Adicionar contexto comercial dentro da conversa.

Permitir, conforme permissao:

- abrir Lead Workspace;
- mover etapa;
- ~~criar atividade;~~ **adiado** - ver `docs/crm-flow/03-platform/DATA_PERSISTENCE_MAP.md`. A tabela `tasks` existe no schema, mas nao ha rota `/api/tasks` nem qualquer escrita funcional hoje; implementar essa acao criaria uma segunda estrutura de falsa persistencia. Retomar quando a API de tasks existir.
- adicionar nota;
- visualizar responsavel e tags.

## 8.5 Fase 6.5 - App Shell: identidade visual Consult Services

Feita antes da Fase 7 funcional, a pedido do usuario: o App Shell (sidebar +
whitelabel) estava com aparencia de produto generico, sem convergencia visual
com a familia Consult Services / 7Commander.

Entregas:

- sidebar com azul institucional Consult Services (`--consult-blue`,
  `#0B3A75`) como fundo padrao, no lugar do azul quase preto anterior
  (`#0F172A`); item ativo em azul claro/ciano institucional
  (`--consult-sky`, `#1D9BF0`), fixo (nao segue whitelabel), com texto em
  azul escuro para contraste;
- bloco de marca fixo no topo da sidebar: marca Consult Services (arquivo
  oficial, recortado do logo quadrado enviado pelo time - ver
  `public/branding/consult-services-mark.png` e `ConsultBrandMark.tsx`) +
  hierarquia igual a do 7Commander (nome do produto em caixa alta/ciano
  como eyebrow, tagline em destaque, "Uma plataforma Consult Services"
  como atribuicao). Fixo mesmo com whitelabel ativo - o produto nao perde
  identidade;
- whitelabel do cliente passou a conviver com a marca do produto: logo e
  nome do tenant aparecem como card secundario ("Cliente: X") abaixo do
  bloco de marca, nunca substituindo-o. Antes, o logo do cliente ocupava
  sozinho o espaco principal de marca da sidebar;
- sidebar recolhida mantem a marca Consult Services (com tooltip), nao mais
  um circulo generico com a inicial do tenant;
- drawer mobile reaproveita o mesmo componente da sidebar desktop (jah era
  assim antes) - identidade visual identica, nenhuma linguagem separada;
- defaults de cor institucional propagados para: fallback de tema
  (`useApplyTenantTheme.ts`/`AppLayout.tsx`), formulario de Identidade
  visual (`Settings.tsx`) e seed do tenant de demonstracao no banco
  (`src/db/index.ts` - so afeta bancos novos, nao migra tenants ja
  existentes).

Fora do escopo desta fase (nao alterado):

- Header (jah estava branco, com hierarquia correta - mantido como estava);
- Dashboard (cards brancos, icones/sombras jah seguiam o padrao - nao
  precisou de ajuste);
- estrutura/nomes dos grupos de navegacao (jah correspondiam ao padrao
  esperado).

Arquivo oficial da logo Consult Services recebido do time e aplicado
(`public/branding/consult-services-mark.png`, recorte do "C" a partir do
logo quadrado oficial - fundo branco original preservado dentro de um
cartao arredondado, mesmo tratamento visual usado pelo 7Commander). Os
logos completos (quadrado e retangular, com wordmark "Consult Services
Tecnologia") tambem foram salvos em `public/branding/` para uso futuro
(ex.: uma tela "Sobre"), mas nao estao referenciados em nenhum componente
ainda - fora do escopo desta fase.

### Correcao pos-comparacao com o 7Commander real

O usuario comparou lado a lado com uma tela real do 7Commander com
whitelabel de cliente aplicado (logo + cor propria) e apontou que o
comportamento nao batia: no CRM Flow, a zona de marca (logo + "CRM
FLOW"/tagline) estava sendo tingida pela cor do whitelabel junto com o
menu, e o logo do cliente aparecia pequeno, dentro de um chip
secundario - nao como no 7Commander, onde o logo do cliente aparece
grande e em destaque, sobre um fundo neutro que nao muda de cor, com a
marca "7Commander / Consult Services" sempre visivel em texto logo
abaixo.

`src/components/layout/Sidebar.tsx` foi reestruturado para ter duas
zonas visualmente distintas, como no 7Commander:

- **Zona de marca** (topo): fundo branco FIXO, nunca tingido por
  `--sidebar-color`. Quando o tenant tem logo customizado, ele aparece
  grande, num cartao proprio; a marca "CRM Flow / Gestao Comercial e
  Atendimento / Uma plataforma Consult Services" continua sempre visivel
  abaixo, em texto escuro (legivel em fundo claro). Sem logo
  customizado, mostra a marca da Consult Services no lugar.
- **Zona de navegacao** (menu + rodape): continua seguindo
  `--sidebar-color`/`--sidebar-text-color` do whitelabel, como antes -
  so a zona de marca deixou de ser tingida.

Validado replicando o mesmo teste do usuario (logo + cor principal
vermelha + menu vermelho escuro + texto branco): resultado visualmente
equivalente ao 7Commander em desktop expandido, recolhido e mobile.

### Remocao de texto "demo" fora da branch demo/localstorage

Reforcado pelo usuario: rotular a experiencia como "demonstrativa" so
faz sentido na branch `demo/localstorage` (que usa dados 100% locais,
sem persistencia real). Encontrados e corrigidos dois textos que
vazavam esse rotulo para as branches com API real:

- `src/pages/chat/Chat.tsx`: texto fixo "Ambiente demonstrativo" sob o
  nome do lead no cabecalho do Chat, substituido pelo telefone do lead
  (dado real ja usado em outros pontos da mesma tela).
- `src/pages/settings/AiSettings.tsx`: aviso de salvamento dizia
  "Configuracoes salvas neste ambiente demonstrativo" - corrigido para
  descrever o que realmente acontece ("salvas apenas neste navegador -
  ainda nao sincronizam com o servidor"), ja que esta tela **ainda nao
  esta ligada a `/api/ai/settings`** (grava so em `localStorage`, achado
  novo que precisa entrar no `DATA_PERSISTENCE_MAP.md`).
- `src/pages/settings/WhatsAppSettings.tsx`: texto descrevia o
  onboarding oficial da Meta como algo para "demonstrar a conexao do
  MVP" - reescrito para descrever a funcao real da tela (conectar e
  manter a integracao ativa).

## 9. Fase 7 - Configuracoes e whitelabel

- padronizar telas;
- adicionar preview do whitelabel;
- validar contraste;
- melhorar status da integracao WhatsApp/Meta;
- padronizar configuracao de IA;
- revisar configuracao de funil.

## 10. Fase 8 - Autorizacao

Sem quebrar os perfis atuais:

- centralizar policy de frontend;
- mapear permissions;
- revisar protecao de rotas;
- revisar validacao backend;
- preparar perfil Gestor se aprovado em tarefa propria.

## 11. Fase 9 - IA operacional

Somente apos estabilizacao das telas principais:

- resumo de conversa;
- sugestao de resposta;
- resumo do lead;
- proxima acao;
- follow-up;
- analise de oportunidade parada.

## 12. Fase 10 - Qualidade final

- acessibilidade;
- mobile;
- tratamento de erros;
- performance;
- auditoria;
- remocao de estilos duplicados;
- revisao de textos;
- testes de regressao.

## 13. Regra de entrega por fase

Cada fase deve:

1. compilar sem erros;
2. preservar funcionalidades anteriores;
3. ser validada nos perfis envolvidos;
4. ser validada em tenant comum e contexto Master quando aplicavel;
5. possuir estados de erro e carregamento;
6. evitar alteracoes fora do escopo da fase;
7. atender aos criterios de aceite documentados.

## 14. Estrategia de branches recomendada

Desenvolvimento deve partir de `develop`.

Sugestao:

- `feature/crm-ui-foundation`
- `feature/crm-app-shell`
- `feature/crm-dashboard-refresh`
- `feature/crm-lead-workspace`
- `feature/crm-chat-context`

Nao concentrar toda a manutencao em uma unica branch de longa duracao se puder ser entregue e validada incrementalmente.
