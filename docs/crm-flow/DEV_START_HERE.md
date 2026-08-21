# CRM Flow - Guia de Inicio para Desenvolvimento

## Objetivo

Este diretório contém a especificação oficial para manutenção e evolução do CRM Flow.

O objetivo não é reconstruir o sistema. O objetivo é preservar as funcionalidades existentes, corrigir inconsistências e alinhar a experiência do CRM Flow ao padrão de produto da Consult Services, usando o 7Commander como referência principal de UX, UI, whitelabel, organização visual e comportamento.

## Regras obrigatórias

1. Não reconstruir o CRM Flow do zero.
2. Preservar funcionalidades atuais antes de qualquer refatoração visual.
3. Manter a stack atual nesta fase, salvo decisão registrada em ADR.
4. Aplicar o padrão visual Consult Services inspirado no 7Commander.
5. Reutilizar componentes. Não criar variantes visuais isoladas por página.
6. Desktop-first, com comportamento responsivo definido.
7. Modal central para confirmação e ações pontuais.
8. Drawer para edição ou consulta contextual de baixa e média complexidade.
9. Página dedicada para operações de maior complexidade.
10. Toda tela com dados deve possuir Loading, Empty, Error e Permission Denied.
11. Whitelabel deve respeitar legibilidade e contraste mínimos.
12. Tenant, perfil e permissões devem ser respeitados em frontend e backend.
13. Atendimento e CRM devem compartilhar contexto de lead e histórico.
14. Evitar lógica de negócio dentro de componentes puramente visuais.
15. Toda alteração deve seguir os critérios de aceite deste diretório.
16. Não remover funcionalidades sem aprovação explícita de produto.
17. Não alterar nomenclaturas de negócio sem atualizar a documentação.

## Ordem de leitura

1. `00-product/PRODUCT_SPEC.md`
2. `01-frontend/FRONTEND_SPEC.md`
3. `01-frontend/DESIGN_SYSTEM.md`
4. `01-frontend/NAVIGATION.md`
5. `02-functional/CRM_OPERATIONS.md`
6. `03-platform/PLATFORM_RULES.md`
7. `04-ai/AI_SPEC.md`
8. `05-maintenance/GAP_ANALYSIS.md`
9. `05-maintenance/MIGRATION_PLAN.md`
10. `05-maintenance/ACCEPTANCE_CRITERIA.md`

## Referência de produto

O 7Commander é a referência visual e comportamental da família Consult Services. Isso não significa copiar sua stack ou estrutura técnica literalmente. O CRM Flow deve parecer parte da mesma família de produtos, mantendo sua arquitetura atual enquanto ela continuar adequada.

## Stack atual a preservar nesta fase

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- React Router
- Express
- Recharts
- Lucide React

## Resultado esperado

Ao final desta manutenção, o usuário deve perceber que CRM Flow, 7Commander e demais produtos Consult Services pertencem ao mesmo ecossistema, com padrões equivalentes de navegação, hierarquia visual, componentes, whitelabel, permissões e estados de interface.
