# CRM Flow - Product Spec

## 1. Visão do produto

CRM Flow é a solução de relacionamento, atendimento e gestão comercial da Consult Services. O produto deve centralizar leads, conversas, pipeline comercial, histórico, atividades e apoio de IA, mantendo contexto único do cliente durante toda a operação.

## 2. Objetivo desta manutenção

A manutenção atual deve consolidar o CRM Flow como produto da família Consult Services, preservando sua base funcional e elevando consistência, usabilidade e governança.

Prioridades:

- padronizar UX/UI com referência no 7Commander;
- integrar melhor atendimento e gestão comercial;
- melhorar leitura e ação sobre leads;
- consolidar whitelabel;
- organizar perfis e permissões;
- criar regras de estados e responsividade;
- preparar evolução da IA operacional;
- reduzir código visual duplicado e decisões locais de interface.

## 3. Perfis de usuário

### Master Consult Services

Responsável pela administração global da plataforma.

Capacidades esperadas:

- visualizar clientes/tenants;
- selecionar tenant para suporte administrativo;
- acompanhar uso global quando autorizado;
- acessar configurações de plataforma;
- não se confundir com usuário operacional do cliente.

### Administrador

Responsável pela configuração do ambiente do cliente.

Capacidades:

- administrar funil;
- configurar identidade visual;
- configurar integrações;
- configurar IA;
- acessar indicadores gerenciais;
- operar leads e conversas.

### Gestor

Perfil previsto para evolução.

Capacidades esperadas:

- acompanhar equipe e indicadores;
- redistribuir leads;
- acompanhar pipeline;
- operar leads e conversas;
- não alterar configurações estruturais sem permissão.

### Atendente

Responsável pela operação diária.

Capacidades:

- acessar conversas permitidas;
- operar leads atribuídos ou disponíveis conforme regra;
- registrar notas e atividades;
- movimentar oportunidade quando autorizado;
- utilizar recursos de IA permitidos.

## 4. Domínios funcionais

### Dashboard

Visão executiva e operacional do ambiente.

### Atendimento

Conversas, filas, respostas rápidas e histórico de interação.

### Gestão Comercial

Funil, leads, etapas, atividades e contexto comercial.

### Configurações

Identidade visual, WhatsApp/Meta, IA e configurações do funil.

### Administração Master

Gestão transversal de tenants e plataforma.

## 5. Princípios de produto

### Contexto único

Lead, conversa, atividade e histórico devem ser apresentados como partes do mesmo relacionamento.

### Menos troca de tela

Consultas e edições contextuais devem preferir drawer quando isso reduzir perda de contexto.

### Ação visível

Cada tela deve deixar evidente o que o usuário pode fazer a seguir.

### Informação acionável

Dashboard e cards devem levar o usuário para a operação correspondente.

### Consistência

Mesma ação deve ter o mesmo nome, componente, posição e comportamento em toda a aplicação quando aplicável.

### Segurança por escopo

Nenhum dado deve atravessar tenant, perfil ou permissão por conveniência de frontend.

## 6. Escopo funcional preservado

A manutenção deve preservar, no mínimo:

- autenticação existente;
- Dashboard;
- conversas;
- respostas rápidas;
- Kanban;
- lista de leads;
- configuração de funil;
- criação e movimentação de leads;
- abertura de contexto de conversa a partir do lead;
- identidade visual;
- integração WhatsApp/Meta existente;
- configurações de IA;
- painel Master;
- seleção de tenant no contexto Master.

## 7. Evoluções prioritárias

1. Design System consistente.
2. Layout e navegação alinhados ao 7Commander.
3. Lead Workspace em drawer amplo.
4. Integração operacional Lead x Atendimento.
5. Dashboard reorganizado por decisão e ação.
6. Filtros e busca na lista de leads.
7. Melhor densidade informacional dos cards do Kanban.
8. Estados UX padronizados.
9. Responsividade real.
10. IA contextual e operacional.

## 8. Fora de escopo imediato

- reescrever o projeto em Next.js apenas para igualar o 7Commander;
- trocar o gerenciador de estado sem necessidade comprovada;
- substituir integrações existentes sem análise específica;
- implantar SSO central da Consult Services nesta manutenção, salvo tarefa própria;
- transformar o CRM Flow no Consult Hub.

## 9. Critério de sucesso

A manutenção será considerada bem-sucedida quando:

- funcionalidades atuais continuarem operacionais;
- telas críticas adotarem o mesmo padrão visual;
- usuário conseguir alternar entre atendimento e gestão comercial sem perder contexto;
- componentes repetidos forem consolidados;
- whitelabel funcionar de forma previsível;
- permissões não dependerem apenas de esconder itens de menu;
- estados de carregamento, vazio e erro forem tratados;
- experiência desktop e mobile tiver comportamento definido.
