# CRM Flow - Frontend Spec

## 1. Objetivo

Definir o padrão oficial de frontend do CRM Flow para manutenção e evolução, alinhado visual e comportamentalmente ao 7Commander sem exigir migração de stack.

## 2. Estrutura base

O frontend deve manter separação clara entre:

- layout;
- componentes visuais genéricos;
- componentes de domínio CRM;
- páginas;
- hooks;
- serviços;
- estado global;
- tipos.

Lógica de negócio não deve ficar acoplada a componentes puramente visuais.

## 3. App Shell

Estrutura obrigatória em desktop:

- sidebar fixa à esquerda;
- header superior;
- área de conteúdo principal;
- comportamento de sidebar recolhida;
- identidade do tenant no topo;
- usuário e perfil no rodapé da sidebar;
- ações globais no header.

### Sidebar expandida

Exibir ícone e label.

### Sidebar recolhida

Exibir somente ícones e tooltip.

### Mobile

Sidebar deve virar drawer acionado pelo header.

## 4. Header

O header deve priorizar contexto da tela, não dados administrativos permanentes.

Estrutura sugerida:

- breadcrumb ou nome da seção;
- título da página quando aplicável;
- ações globais;
- ajuda;
- notificações futuras;
- avatar/menu do usuário.

Informações como tenant e usuário autenticado não devem consumir espaço excessivo.

## 5. Cabeçalho de página

Toda página principal deve usar componente reutilizável de Page Header com:

- título;
- descrição curta;
- ações secundárias;
- ação principal.

Exemplo:

```text
Funil de Leads
Acompanhe as oportunidades comerciais em cada etapa do processo.

[Filtros] [Importar] [+ Novo Lead]
```

## 6. Regras de Modal, Drawer e Página

### Modal

Usar para:

- confirmação;
- exclusão;
- mudança crítica;
- ações curtas;
- decisões que exigem foco.

### Drawer

Usar para:

- edição contextual;
- consulta de lead;
- tarefas;
- notas;
- atividades;
- cadastro simples;
- detalhes rápidos.

### Página dedicada

Usar para:

- configurações complexas;
- relatórios;
- administração;
- integrações;
- whitelabel;
- gestão estrutural do funil.

## 7. Tabelas

Tabelas devem possuir:

- cabeçalho fixo quando útil;
- ordenação quando aplicável;
- busca;
- filtros;
- paginação ou carregamento incremental;
- estado vazio;
- linha clicável quando existir detalhe contextual;
- ações por menu contextual quando houver mais de duas ações secundárias.

Evitar excesso de botões por linha.

## 8. Cards

Todo card deve seguir regras consistentes de:

- radius;
- padding;
- borda;
- sombra discreta;
- tipografia;
- hover;
- foco de teclado;
- hierarquia de informação.

Cards de KPI devem ser clicáveis quando existir destino operacional correspondente.

## 9. Formulários

Formulários devem possuir:

- label visível;
- helper text quando necessário;
- validação inline;
- mensagem objetiva de erro;
- indicação clara de campo obrigatório;
- estado disabled;
- estado loading no submit;
- prevenção de duplo envio.

Botão primário deve representar a ação principal.

## 10. Feedback visual

Ações assíncronas devem informar:

- carregamento;
- sucesso;
- erro;
- possibilidade de retry quando aplicável.

Não depender apenas de console ou mudança silenciosa de estado.

## 11. Acessibilidade mínima

- foco visível;
- contraste adequado;
- controles com label acessível;
- navegação por teclado em componentes críticos;
- ícones não devem ser a única forma de comunicar significado;
- estados de erro devem ser identificáveis por texto.

## 12. Responsividade

### Desktop

Experiência completa com sidebar e múltiplas colunas.

### Tablet

Sidebar recolhida por padrão e conteúdos adaptáveis.

### Mobile

- menu em drawer;
- ações principais preservadas;
- tabelas convertidas ou roláveis com critério;
- Kanban não deve comprimir várias colunas na mesma largura.

## 13. Regra do Kanban em mobile

Preferir uma etapa por vez com seletor de etapa, contagem e navegação entre etapas.

## 14. Proibições

- não criar cores hardcoded fora do sistema de tokens, salvo visualização de dados controlada;
- não criar novo componente visual se já existir equivalente reutilizável;
- não duplicar regra de permissão em várias páginas;
- não usar modal para telas longas e complexas;
- não esconder erro de API;
- não expor detalhe técnico de exceção ao usuário final.
