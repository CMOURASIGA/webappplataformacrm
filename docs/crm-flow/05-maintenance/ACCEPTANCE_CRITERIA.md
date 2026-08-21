# CRM Flow - Criterios de Aceite

## 1. Objetivo

Definir condicoes minimas para considerar uma entrega de manutencao concluida.

## 2. Criterios gerais

- Funcionalidade existente preservada, salvo mudanca aprovada.
- Sem erro de compilacao TypeScript.
- Sem erro bloqueante no console durante fluxo principal.
- Sem quebra de rota autorizada.
- Sem vazamento de dados entre tenants.
- Componentes reutilizaveis utilizados quando equivalentes existirem.
- Estado loading implementado quando houver operacao assincrona relevante.
- Estado error implementado quando houver possibilidade de falha.
- Estado empty orienta o usuario sobre proxima acao.
- Responsividade validada em desktop, tablet e mobile para telas alteradas.
- Navegacao por teclado preservada em controles principais.
- Contraste adequado nas combinacoes de whitelabel suportadas.

## 3. App Shell

Aceite quando:

- sidebar expandida funciona;
- sidebar recolhida funciona;
- tooltip aparece nos itens recolhidos;
- item ativo e visivel;
- menu mobile funciona;
- usuario e perfil aparecem corretamente;
- logo/nome do tenant respeitam whitelabel;
- rotas ficam visiveis somente conforme policy de frontend;
- protecao de rota continua valida.

## 4. Dashboard

Aceite quando:

- KPIs carregam sem quebrar com valor nulo;
- cards clicaveis direcionam para a visao correta;
- Admin e Atendente veem apenas informacoes autorizadas;
- erro de API gera feedback de interface;
- graficos se adaptam ao container;
- layout responde em telas menores.

## 5. Kanban

Aceite quando:

- todas as etapas configuradas aparecem na ordem correta;
- contagem por etapa esta correta;
- drag and drop preserva funcionamento;
- movimentacao persiste corretamente;
- card usa padrao definido;
- Lead Workspace pode ser aberto;
- estado sem funil possui orientacao e CTA quando permitido;
- mobile nao comprime todas as colunas de forma inutilizavel.

## 6. Lista de Leads

Aceite quando:

- busca funciona;
- filtros aplicam corretamente;
- limpeza de filtros funciona;
- tabela nao quebra com dados ausentes opcionais;
- clique na linha abre Lead Workspace;
- paginacao ou estrategia equivalente evita degradacao com volume relevante;
- estado vazio diferencia sem registros de sem resultados de filtro.

## 7. Lead Workspace

Aceite quando:

- abre sem perder a tela de origem;
- apresenta dados do lead correto;
- respeita tenant;
- exibe historico em ordem coerente;
- conversa e contexto comercial permanecem vinculados;
- alteracoes exibem feedback;
- fechamento retorna ao contexto anterior;
- permissoes controlam acoes disponiveis.

## 8. Atendimento integrado

Aceite quando:

- conversa mostra contexto do lead vinculado;
- usuario pode abrir Lead Workspace;
- alteracao de etapa, atividade ou nota respeita permissao;
- nenhuma acao comercial interrompe ou perde a conversa atual sem necessidade;
- falha de uma acao comercial nao apaga texto de mensagem ainda nao enviado.

## 9. Whitelabel

Aceite quando:

- logo atualiza no preview;
- nome atualiza no preview;
- cores suportadas atualizam no preview;
- contraste invalido recebe bloqueio ou orientacao;
- salvar aplica tema ao tenant correto;
- tema de um tenant nao afeta outro;
- ausencia de personalizacao usa tema padrao Consult Services.

## 10. Permissoes

Aceite quando:

- esconder menu nao e a unica protecao;
- rota proibida nao pode ser acessada por URL direta;
- operacao proibida e rejeitada pelo backend;
- Master, Admin e Atendente foram testados nas telas alteradas.

## 11. IA

Aceite quando:

- falha do provedor nao bloqueia operacao principal;
- resposta de IA e identificada como sugestao quando aplicavel;
- contexto pertence ao tenant atual;
- acao que altera estado exige confirmacao salvo regra automatizada aprovada;
- loading e erro sao exibidos;
- texto digitado pelo usuario nao e perdido em falha.

## 12. Definition of Done da manutencao

Uma tarefa so deve ser marcada como concluida quando:

1. codigo implementado;
2. lint/typecheck executado;
3. fluxo funcional testado;
4. perfis envolvidos validados;
5. responsividade verificada;
6. estados UX verificados;
7. regressao principal verificada;
8. documentacao atualizada se a regra mudou.
