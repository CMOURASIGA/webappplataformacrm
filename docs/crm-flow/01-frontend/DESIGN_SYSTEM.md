# CRM Flow - Design System

## 1. Referência

O Design System do CRM Flow deve seguir a linguagem visual do 7Commander como referência de família de produto Consult Services.

O objetivo é consistência perceptiva, não cópia literal de implementação.

## 2. Tokens obrigatórios

Centralizar tokens para:

- cor primária;
- cor secundária;
- background da aplicação;
- superfícies;
- bordas;
- textos primário, secundário e desabilitado;
- estados success, warning, danger e info;
- radius;
- spacing;
- sombra;
- tipografia;
- z-index de modal, drawer, tooltip e dropdown.

## 3. Whitelabel

O tenant poderá alterar, conforme regra de produto:

- logo;
- nome exibido;
- cor principal;
- cor da sidebar;
- cor de texto da sidebar.

O sistema deve validar contraste mínimo e impedir combinações que prejudiquem leitura.

A personalização não pode alterar estrutura, espaçamento ou componentes de forma arbitrária.

## 4. Tipografia

Definir hierarquia consistente:

- Page Title;
- Section Title;
- Body;
- Caption;
- Label;
- Helper Text;
- KPI Value.

Evitar uso indiscriminado de uppercase. Uppercase deve ficar restrito a labels curtos, agrupadores ou microcopy quando fizer sentido.

## 5. Componentes base obrigatórios

A camada `components/ui` deve ser a fonte oficial para componentes genéricos.

No mínimo:

- Button;
- IconButton;
- Input;
- Textarea;
- Select;
- Checkbox;
- Radio;
- Switch;
- Badge;
- Tag;
- Card;
- KPI Card;
- Modal;
- Drawer;
- Tooltip;
- Dropdown Menu;
- Table;
- Empty State;
- Loading State;
- Error State;
- Page Header;
- Search Field;
- Filter Bar;
- Tabs;
- Avatar;
- Skeleton.

## 6. Botões

Variantes oficiais:

### Primary
Ação principal da tela ou fluxo.

### Secondary
Ação importante, porém não principal.

### Ghost
Ação de baixa ênfase.

### Danger
Exclusão, cancelamento irreversível ou ação destrutiva.

Regras:

- no máximo uma ação primária dominante por bloco;
- loading deve impedir clique duplicado;
- ícone pode complementar, nunca substituir label em ação importante;
- tamanho deve seguir escala padronizada.

## 7. Cards

### KPI Card

Conteúdo recomendado:

- ícone;
- label;
- valor;
- contexto ou comparação;
- comportamento clicável quando houver destino.

### Lead Card

Conteúdo mínimo desejável:

- nome do lead;
- origem;
- tags;
- responsável quando houver;
- valor da oportunidade quando houver;
- última interação;
- sinalização de pendência.

Dados secundários devem ser progressivamente revelados, evitando poluição.

## 8. Status e badges

Status devem usar texto + cor. Nunca apenas cor.

Exemplos:

- Ativo;
- Em atendimento;
- Aguardando cliente;
- Ganho;
- Perdido;
- Sem responsável.

## 9. Espaçamento

Usar escala consistente. Evitar valores arbitrários em cada tela.

Sugestão de base:

- 4px;
- 8px;
- 12px;
- 16px;
- 24px;
- 32px;
- 40px.

## 10. Estados interativos

Todo controle deve prever:

- default;
- hover;
- focus;
- active;
- disabled;
- loading quando aplicável;
- error quando aplicável.

## 11. Gráficos

Gráficos devem:

- usar paleta controlada;
- apresentar legenda quando necessário;
- ter tooltip;
- evitar excesso de cores;
- priorizar leitura sobre decoração;
- manter contraste em whitelabel.

## 12. Ícones

Usar Lucide React como biblioteca padrão enquanto não houver decisão diferente.

Não misturar bibliotecas de ícones sem necessidade.

## 13. Critério de consistência

Quando dois elementos cumprem a mesma função em telas diferentes, devem usar o mesmo componente ou variante documentada.
