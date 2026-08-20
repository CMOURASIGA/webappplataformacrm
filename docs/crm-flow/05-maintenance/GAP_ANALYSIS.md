# CRM Flow - Gap Analysis

## 1. Objetivo

Registrar as principais diferenças entre o estado atual do CRM Flow e o padrão desejado da família Consult Services, usando o 7Commander como referência de experiência.

## 2. Pontos positivos atuais

O CRM Flow já possui:

- separação por páginas e componentes;
- App Layout com sidebar e header;
- whitelabel básico por tenant;
- Dashboard operacional;
- Kanban com drag and drop;
- lista de leads;
- conversa vinculada a lead;
- configuração de funil;
- configuração de IA;
- integração WhatsApp/Meta;
- área Master;
- perfis master, admin e user.

Isso significa que a manutenção deve evoluir a base atual e não descartá-la.

## 3. Gaps de frontend

### GF-01 - Design System incompleto

Problema:

Existem componentes reutilizáveis, porém ainda há estilos e padrões aplicados diretamente nas páginas.

Ação:

Consolidar tokens e componentes oficiais.

Prioridade: Alta.

### GF-02 - Sidebar sem comportamento completo de produto

Problema:

Sidebar atual é funcional, porém não oferece padrão recolhido/expandido e responsividade equivalente ao padrão desejado.

Ação:

Implementar sidebar reutilizável, recolhível e mobile drawer.

Prioridade: Alta.

### GF-03 - Header com excesso de informação administrativa

Problema:

Header prioriza status Online, usuário e cliente ativo em vez do contexto da tarefa.

Ação:

Reestruturar para contexto da página, breadcrumb e ações.

Prioridade: Média.

### GF-04 - Cabeçalhos de página inconsistentes

Problema:

Nem todas as páginas usam o mesmo padrão de título, descrição e ações.

Ação:

Criar PageHeader oficial.

Prioridade: Alta.

### GF-05 - Estados UX inconsistentes

Problema:

Algumas telas exibem mensagens cruas, como ausência de funil, sem orientação de próximo passo.

Ação:

Criar LoadingState, EmptyState, ErrorState e PermissionState.

Prioridade: Alta.

### GF-06 - Responsividade insuficientemente especificada

Ação:

Implementar comportamento desktop, tablet e mobile documentado.

Prioridade: Alta.

## 4. Gaps operacionais

### GO-01 - Lead e Atendimento ainda parecem áreas separadas

Problema:

Existe integração, porém o usuário ainda precisa navegar entre contextos para reunir informação comercial e de atendimento.

Ação:

Criar Lead Workspace e ampliar contexto comercial dentro da conversa.

Prioridade: Crítica.

### GO-02 - Card do Kanban com baixa densidade decisória

Problema:

Card atual traz nome, origem, tags, telefone e data, mas não comunica de forma rápida responsável, valor, última interação e pendência.

Ação:

Redesenhar card preservando simplicidade.

Prioridade: Alta.

### GO-03 - Lista de Leads precisa funcionar como visão operacional

Ação:

Consolidar filtros, busca, colunas essenciais e abertura contextual do Lead Workspace.

Prioridade: Alta.

### GO-04 - Histórico de relacionamento fragmentado

Ação:

Unificar linha do tempo de eventos relevantes do lead.

Prioridade: Alta.

### GO-05 - Atividades comerciais precisam ganhar presença maior

Ação:

Expor próxima atividade, vencimentos e ações no Lead Workspace, Dashboard e contexto da conversa.

Prioridade: Alta.

## 5. Gaps de plataforma

### GP-01 - Permissões baseadas principalmente em roles locais

Problema:

Checks de perfil espalhados tendem a crescer e gerar inconsistência.

Ação:

Criar política central de autorização preparada para permissions/features.

Prioridade: Alta.

### GP-02 - Whitelabel sem preview completo

Ação:

Adicionar preview realista antes de salvar e validação de contraste.

Prioridade: Média.

### GP-03 - Auditoria precisa ser formalizada

Ação:

Preparar registro de eventos sensíveis.

Prioridade: Média.

### GP-04 - Compatibilidade futura com identidade/licenciamento central

Ação:

Evitar novas decisões que impeçam futura integração com Consult Hub e camada central de identidade/licenciamento.

Prioridade: Arquitetural.

## 6. Gaps de IA

### GI-01 - IA precisa estar mais próxima da operação

Ação:

Priorizar resumo, sugestão de resposta, próxima ação, follow-up e análise contextual.

Prioridade: Alta após estabilização do frontend.

### GI-02 - Abstração de provedor

Ação:

Evitar acoplamento da UI ao nome ou SDK de um provedor específico.

Prioridade: Média.

## 7. Ordem recomendada de correção

1. Design System e App Shell.
2. Estados UX e responsividade.
3. Dashboard, Leads e Kanban.
4. Lead Workspace.
5. Integração Lead x Atendimento.
6. Perfis e permissões.
7. Whitelabel.
8. IA operacional.
9. Auditoria e refinamentos.
