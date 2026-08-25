# CRM Flow - Indice da Especificacao

## Inicio

- [DEV_START_HERE.md](./DEV_START_HERE.md) - leitura obrigatoria antes de qualquer manutencao.

## Produto

- [PRODUCT_SPEC.md](./00-product/PRODUCT_SPEC.md) - visao, escopo, perfis, dominios e criterios de sucesso.

## Frontend

- [FRONTEND_SPEC.md](./01-frontend/FRONTEND_SPEC.md) - regras de layout, componentes, formularios, responsividade e acessibilidade.
- [DESIGN_SYSTEM.md](./01-frontend/DESIGN_SYSTEM.md) - tokens, componentes oficiais, whitelabel e consistencia visual.
- [NAVIGATION.md](./01-frontend/NAVIGATION.md) - sidebar, header, rotas, navegacao contextual e mobile.

## Operacao

- [CRM_OPERATIONS.md](./02-functional/CRM_OPERATIONS.md) - Dashboard, Kanban, Leads, Lead Workspace, Atendimento e Configuracoes.

## Plataforma

- [PLATFORM_RULES.md](./03-platform/PLATFORM_RULES.md) - multitenancy, autorizacao, seguranca, whitelabel, auditoria e APIs.
- [DATA_PERSISTENCE_MAP.md](./03-platform/DATA_PERSISTENCE_MAP.md) - mapa de persistencia por feature (store, API, banco), usado para decidir o que o frontend pode apresentar como funcionalidade oficial.

## Inteligencia Artificial

- [AI_SPEC.md](./04-ai/AI_SPEC.md) - IA contextual, operacional, seguranca, provedores e metricas.

## Manutencao

- [GAP_ANALYSIS.md](./05-maintenance/GAP_ANALYSIS.md) - diferencas entre o estado atual e o padrao desejado.
- [MIGRATION_PLAN.md](./05-maintenance/MIGRATION_PLAN.md) - ordem de execucao recomendada por fases.
- [ACCEPTANCE_CRITERIA.md](./05-maintenance/ACCEPTANCE_CRITERIA.md) - criterios de aceite e Definition of Done.

## Regra de precedencia

Em caso de duvida durante o desenvolvimento:

1. seguranca e isolamento de tenant prevalecem sobre conveniencia de UI;
2. regra funcional documentada prevalece sobre comportamento visual legado, desde que a mudanca esteja dentro do escopo aprovado;
3. Design System prevalece sobre estilo local de pagina;
4. preservar funcionalidade existente e obrigatorio salvo mudanca explicitamente aprovada;
5. o 7Commander e referencia de experiencia da familia Consult Services, nao obrigacao de copiar tecnologia.
