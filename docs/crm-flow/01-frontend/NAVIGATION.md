# CRM Flow - Navigation

## 1. Estrutura principal

A navegação deve ser previsível, simples e equivalente ao padrão da família Consult Services.

### Geral

- Painel

### Atendimento

- Conversas
- Respostas Rápidas

### Gestão Comercial

- Funil de Leads
- Lista de Leads
- Configuração do Funil

### Configurações

- Identidade Visual
- WhatsApp/Meta
- Inteligência Artificial

### Master Consult Services

- Painel Master
- Clientes
- Uso de IA

## 2. Regras por perfil

Itens de navegação devem ser derivados de uma política central de permissões.

Esconder um item de menu não substitui autorização de rota ou backend.

Perfis operacionais não devem visualizar configurações que não possam acessar.

## 3. Sidebar

### Expandida

- ícone + label;
- agrupadores visuais discretos;
- item ativo claramente identificado;
- logo do tenant no topo;
- usuário e perfil no rodapé.

### Recolhida

- somente ícones;
- tooltip com label;
- mesmo estado ativo;
- persistência opcional da preferência do usuário.

## 4. Header e breadcrumb

Usar breadcrumb quando houver profundidade real.

Exemplos:

```text
CRM Flow > Gestão Comercial > Funil de Leads
CRM Flow > Configurações > WhatsApp/Meta
```

Não exibir breadcrumb desnecessário em páginas de primeiro nível.

## 5. Deep links

Filtros e visões importantes devem poder ser representados por URL quando isso melhorar navegação e compartilhamento interno.

Exemplos:

- `/chat?view=abertas`
- `/chat?view=fila`
- `/leads?stage=proposta`

Evitar estado crítico apenas em memória quando o usuário pode precisar voltar, atualizar ou compartilhar a visão.

## 6. Navegação contextual

Ao abrir Lead Workspace, o usuário deve permanecer na tela de origem sempre que possível.

Exemplos:

- Kanban -> Lead Workspace;
- Lista de Leads -> Lead Workspace;
- Conversa -> Contexto Comercial do Lead.

## 7. Voltar

Não depender exclusivamente do botão do navegador em fluxos complexos. Drawers e páginas de configuração devem fornecer ação de fechamento ou retorno adequada.

## 8. Mobile

A sidebar vira drawer.

A navegação deve preservar todas as áreas permitidas, sem ocultar funcionalidades essenciais apenas por limitação de largura.
