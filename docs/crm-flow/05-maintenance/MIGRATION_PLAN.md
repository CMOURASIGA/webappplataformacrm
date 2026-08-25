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
