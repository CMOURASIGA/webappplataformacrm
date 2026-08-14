# Epic 09 - Importacao, chat interno e historico de atendimento de leads

Baseado na especificacao em `documentacao/especificacao_importacao_chat_historico_leads.md`.

Contratos implementados em `documentacao/api-epic09.md`.

Este epic consolida a inovacao que sera aplicada ao CRM: importar leads em lote, permitir colaboracao interna entre usuarios da plataforma e transformar ciclos reais de conversa com o lead em registros oficiais de atendimento.

Principio central da implementacao:
- conversa externa e a interacao com o lead, como WhatsApp;
- chat interno e comunicacao privada entre usuarios da plataforma;
- registro de atendimento e o resumo revisado de um ciclo especifico;
- historico de atendimento e a linha do tempo formada pelos registros salvos.

Esses conceitos nao devem compartilhar a mesma tabela de mensagens nem gerar efeitos automaticos entre si sem uma acao explicita do usuario.

## US-061 - Criar estrutura de dados para registros de atendimento
Como plataforma, quero armazenar registros de atendimento por lead e conversa, para manter uma linha do tempo oficial sem repetir mensagens ja analisadas.

Criterios de aceite:
- existe uma estrutura persistente para `lead_service_records`;
- cada registro possui `tenant_id`, `lead_id`, `conversation_id` e `attendant_id`;
- cada registro guarda periodo inicial e final do ciclo de atendimento;
- cada registro guarda `first_message_id`, `last_message_id` e quantidade de mensagens analisadas;
- cada registro armazena resumo, topicos, necessidades, objecoes, decisoes, pendencias, proxima acao e sentimento;
- a estrutura registra modelo de IA usado, usuario revisor e datas de geracao, revisao, criacao e atualizacao;
- os dados respeitam isolamento por tenant.

## US-062 - Identificar mensagens ainda nao registradas
Como atendente, quero saber quais mensagens da conversa ainda nao viraram registro de atendimento, para registrar apenas o ciclo atual.

Criterios de aceite:
- o backend identifica o ultimo registro salvo da conversa;
- somente mensagens posteriores ao `last_message_id` do ultimo registro ficam elegiveis;
- o sistema retorna contagem de mensagens pendentes;
- quando nao houver registro anterior, todas as mensagens validas da conversa ficam elegiveis;
- mensagens internas nao entram nessa contagem;
- o sistema impede que uma mensagem ja registrada seja incluida novamente em outro registro.

## US-063 - Alterar acao de resumo para Registrar atendimento
Como atendente, quero ver a acao `Registrar atendimento` na conversa, para entender que estou criando um registro oficial do ciclo atual.

Criterios de aceite:
- o botao atual de resumo da conversa e renomeado para `Registrar atendimento`;
- a acao usa apenas mensagens ainda nao registradas;
- a interface mostra a quantidade de mensagens pendentes antes da acao;
- quando nao houver mensagens novas, a acao fica bloqueada ou informa que nao existem novas mensagens para registrar;
- o texto da interface nao sugere que sera gerado um resumo acumulado de toda a conversa.

## US-064 - Gerar previa de registro de atendimento com IA
Como atendente, quero que a IA gere uma previa do atendimento atual, para revisar rapidamente o que deve entrar no historico do lead.

Criterios de aceite:
- existe endpoint para gerar previa do registro sem salvar automaticamente;
- a IA recebe apenas as mensagens elegiveis do ciclo atual;
- a previa contem resumo, assuntos tratados, necessidades, objecoes, decisoes, pendencias, proxima acao e sentimento;
- a previa informa periodo analisado, atendente, primeira mensagem, ultima mensagem e quantidade de mensagens;
- falhas da IA sao tratadas sem criar registro parcial;
- logs tecnicos permitem diagnosticar falha de geracao sem expor dados sensiveis ao usuario.

## US-065 - Revisar e salvar registro de atendimento
Como atendente, quero revisar e editar a previa antes de salvar, para garantir que o historico oficial fique correto.

Criterios de aceite:
- a interface abre uma etapa de revisao antes de salvar;
- o usuario pode editar os campos textuais e listas geradas pela IA;
- o registro so e criado apos confirmacao do usuario;
- ao salvar, o sistema persiste o usuario que revisou e a data de revisao;
- depois de salvo, as mensagens do intervalo ficam bloqueadas para novo registro;
- o sistema permite mais de um registro no mesmo dia e por atendentes diferentes.

## US-066 - Consultar historico de atendimento na ficha do lead
Como usuario autorizado, quero ver o historico de atendimento na ficha do lead, para entender rapidamente o que ja aconteceu em atendimentos anteriores.

Criterios de aceite:
- existe aba `Historico de atendimento` na ficha do lead;
- os registros aparecem em ordem cronologica adequada para leitura operacional;
- cada item mostra data, horario inicial e final, atendente, canal, resumo, pendencias, proxima acao, quantidade de mensagens e data de criacao;
- a tela informa quando o lead ainda nao possui registros;
- a consulta respeita tenant e permissoes de acesso ao lead.

## US-067 - Exibir historico de atendimento pelo Kanban
Como atendente, quero consultar o historico pelo card do lead no Kanban, para decidir o proximo passo sem sair do fluxo comercial.

Criterios de aceite:
- o card do Kanban possui acao `Ver historico de atendimento`;
- a acao abre drawer ou painel lateral com aba de historico;
- o historico exibido e o mesmo da ficha do lead;
- o painel tambem permite navegar entre resumo, conversa, historico, discussao interna e dados do lead quando essas abas existirem;
- o carregamento do historico nao quebra o Kanban se ocorrer erro.

## US-068 - Mostrar ultimo atendimento e pendencias no Kanban
Como time comercial, quero ver sinais do ultimo atendimento no card do lead, para priorizar retornos e pendencias.

Criterios de aceite:
- o card pode exibir data do ultimo atendimento;
- o card pode exibir atendente responsavel pelo ultimo atendimento;
- o card pode exibir proxima acao;
- o card informa quantidade de mensagens ainda nao registradas;
- pendencias vencidas recebem indicador visual claro;
- a exibicao e compacta e nao prejudica a leitura principal do funil.

## US-069 - Filtrar historico de atendimento
Como gestor ou atendente, quero filtrar o historico do lead, para encontrar registros relevantes rapidamente.

Criterios de aceite:
- o historico permite filtros por todos, hoje e ultimos 7 dias;
- o historico permite filtro por atendente;
- o historico permite filtro por registros com pendencias;
- o historico permite filtro por registros com proxima acao;
- filtros vazios exibem estado sem resultado sem erro tecnico;
- os filtros funcionam com dados paginados ou carregamento progressivo, se aplicavel.

## US-070 - Criar estrutura de dados para chat interno
Como plataforma, quero separar o chat interno da conversa externa, para permitir colaboracao privada sem risco de envio ao lead.

Criterios de aceite:
- existem estruturas para canais internos, membros, mensagens internas e mencoes;
- os canais suportam tipos `direct`, `group`, `company` e `lead`;
- canais vinculados a lead possuem `lead_id`;
- mensagens internas possuem autor, texto, datas de criacao, edicao e exclusao logica;
- membros possuem papel e marcador de ultima leitura;
- nenhuma mensagem interna e salva na estrutura de conversas externas.

## US-071 - Criar conversas diretas entre usuarios
Como usuario da plataforma, quero conversar diretamente com outro usuario, para alinhar atendimentos sem usar canais externos.

Criterios de aceite:
- o usuario consegue iniciar conversa direta com outro usuario autorizado;
- a conversa direta reutiliza o mesmo canal quando ja existir entre os participantes;
- mensagens exibem autor, data e hora;
- participantes nao autorizados nao conseguem acessar a conversa;
- a conversa direta nao envia mensagens ao lead nem a qualquer integracao externa.

## US-072 - Criar canais e grupos internos
Como administrador, quero criar canais e grupos internos, para organizar comunicacoes por equipe ou area.

Criterios de aceite:
- administradores podem criar canais de grupo;
- e possivel definir nome, descricao, tipo e privacidade do canal;
- administradores podem adicionar e remover participantes;
- usuarios visualizam apenas canais aos quais pertencem ou que sejam permitidos pela regra do tenant;
- canais padrao como Todos, Comercial, Suporte ou Administradores podem ser criados conforme configuracao do produto.

## US-073 - Criar discussao interna vinculada ao lead
Como atendente, quero iniciar uma discussao interna a partir de um lead, para pedir apoio sem expor a conversa ao cliente.

Criterios de aceite:
- a ficha do lead possui acesso `Discussao interna`;
- o card do Kanban possui acao `Abrir discussao interna`;
- ambos os acessos abrem a mesma conversa interna vinculada ao lead;
- se a discussao ainda nao existir, o sistema cria um canal do tipo `lead`;
- usuarios sem acesso ao lead nao conseguem acessar a discussao;
- mensagens dessa discussao nunca aparecem na conversa externa do lead.

## US-074 - Implementar mencoes e nao lidas no chat interno
Como usuario da plataforma, quero receber indicacoes de mencao e mensagens nao lidas, para acompanhar colaboracoes relevantes.

Criterios de aceite:
- mensagens aceitam mencoes no formato `@usuario`;
- mencoes sao persistidas com usuario mencionado;
- o sistema calcula contador de mensagens nao lidas por canal;
- ao abrir o canal, o marcador de ultima leitura do usuario e atualizado;
- mensagens mencionando o usuario podem ter destaque visual;
- a ausencia de notificacao push no MVP nao impede o funcionamento das mencoes e contadores internos.

## US-075 - Registrar decisao do chat interno no historico
Como atendente ou administrador, quero transformar uma decisao relevante do chat interno em registro no historico do lead, para documentar oficialmente o que foi combinado.

Criterios de aceite:
- mensagens internas nao entram automaticamente no historico;
- existe acao manual `Registrar decisao no historico` em discussoes vinculadas ao lead;
- a acao abre revisao antes de salvar;
- o registro criado identifica que a origem foi chat interno;
- o conteudo salvo fica disponivel no historico de atendimento do lead;
- a acao respeita permissoes de acesso ao lead e ao canal.

## US-076 - Criar modelo padrao para importacao de leads
Como usuario autorizado, quero baixar um modelo de planilha, para preencher os leads no formato esperado pelo sistema.

Criterios de aceite:
- a tela de leads possui botao `Importar leads`;
- o fluxo de importacao permite baixar arquivo modelo;
- o modelo contem colunas `nome`, `telefone`, `email`, `empresa`, `origem`, `responsavel`, `funil`, `etapa`, `tags` e `observacao`;
- `nome` e `telefone` sao marcados como obrigatorios;
- o modelo e compativel com CSV e XLSX ou possui orientacao clara de uso para ambos os formatos;
- o arquivo nao contem dados reais de clientes.

## US-077 - Validar arquivo de importacao de leads
Como usuario autorizado, quero validar um arquivo antes de importar, para corrigir erros sem criar dados inconsistentes.

Criterios de aceite:
- o sistema aceita arquivos CSV e XLSX;
- arquivo vazio, formato invalido e colunas obrigatorias ausentes sao rejeitados;
- nome ausente, telefone ausente ou invalido e email invalido sao identificados por linha;
- funil, etapa e responsavel inexistentes sao identificados por linha;
- tags separadas por virgula sao normalizadas;
- a validacao retorna lista de erros com numero da linha e motivo.

## US-078 - Prever importacao e tratar duplicidades
Como usuario autorizado, quero ver uma previa da importacao com duplicidades, para decidir o comportamento antes de salvar os leads.

Criterios de aceite:
- existe endpoint de previa da importacao;
- a previa informa total de linhas, registros validos, registros com erro e duplicidades;
- duplicidade e analisada prioritariamente por telefone normalizado, email normalizado e combinacao de telefone e email;
- o comportamento padrao e ignorar registros duplicados e apresentar relatorio;
- o fluxo permite escolher entre ignorar duplicado, atualizar lead existente, criar novo lead ou analisar individualmente quando implementado;
- a previa nao cria leads definitivos.

## US-079 - Executar importacao e gerar relatorio final
Como usuario autorizado, quero confirmar a importacao validada, para criar os leads validos e receber um resultado rastreavel.

Criterios de aceite:
- existe endpoint de execucao da importacao;
- a execucao cria apenas leads validos conforme comportamento escolhido para duplicidades;
- os leads importados entram no funil e etapa definidos ou nos padroes do tenant quando ausentes;
- o sistema cria lote de importacao com status, arquivo, totais, usuario criador, datas e configuracoes;
- cada linha importada ou rejeitada fica registrada com dados brutos, dados normalizados, status, lead associado e erro quando houver;
- ao final, a tela mostra total de linhas, leads importados, duplicidades ignoradas e registros com erro.

## US-080 - Baixar relatorio de erros da importacao
Como usuario autorizado, quero baixar os registros rejeitados, para corrigir a planilha e tentar importar novamente.

Criterios de aceite:
- existe endpoint para baixar erros de um lote de importacao;
- o relatorio contem numero da linha, dados enviados e motivo da rejeicao;
- o arquivo e compativel com planilha;
- o relatorio respeita tenant e permissoes;
- lotes sem erro retornam estado adequado sem gerar arquivo vazio confuso;
- o download nao expoe dados de outros tenants.

## US-081 - Aplicar permissoes e auditoria aos novos recursos
Como administrador da plataforma, quero que importacao, chat interno e historico respeitem perfis e auditoria, para manter governanca e rastreabilidade.

Criterios de aceite:
- atendentes so importam leads quando possuirem permissao especifica;
- administradores podem importar leads, consultar lotes, criar canais e gerenciar membros;
- atendentes podem registrar seus atendimentos e consultar historico dos leads aos quais possuem acesso;
- administradores podem consultar todos os historicos do tenant e corrigir registros conforme politica definida;
- alteracoes relevantes registram usuario, tenant, acao, data e hora, valor anterior, valor posterior e origem da acao;
- tentativas negadas retornam erro de permissao tratado.

## US-082 - Expor APIs dos novos fluxos
Como desenvolvedor, quero endpoints claros para importacao, chat interno, registro e historico, para implementar frontend e backend de forma desacoplada.

Criterios de aceite:
- importacao expoe `POST /api/leads/import/preview`, `POST /api/leads/import/execute`, `GET /api/leads/imports`, `GET /api/leads/imports/:batchId` e `GET /api/leads/imports/:batchId/errors`;
- chat interno expoe rotas para listar/criar canais, listar/enviar mensagens, gerenciar membros e obter canal interno de um lead;
- registro e historico expoem rotas para listar registros do lead, consultar mensagens nao registradas, gerar previa, salvar registro, editar registro e consultar detalhe;
- todas as APIs validam tenant, usuario autenticado e permissoes;
- respostas de erro sao padronizadas e utilizaveis pelo frontend;
- contratos de payload ficam documentados junto da implementacao ou em arquivo de apoio.

## US-083 - Testar integracao dos fluxos de atendimento
Como time de desenvolvimento, quero testes dos novos fluxos, para reduzir regressao em conversas, Kanban, IA e importacao.

Criterios de aceite:
- ha testes para impedir duplicidade de mensagens em registros de atendimento;
- ha testes para previa e salvamento revisado do registro;
- ha testes para historico na ficha do lead e no Kanban;
- ha testes para chat interno nao enviar mensagem ao lead;
- ha testes para validacao, duplicidade, execucao e relatorio de importacao;
- cenarios multi-tenant e permissao sao cobertos nos pontos criticos.

## Rastreabilidade

- Secoes 2, 6.1 e 8 da especificacao: US-076, US-077, US-078, US-079 e US-080.
- Secoes 3, 6.2, 7 e 8 da especificacao: US-070, US-071, US-072, US-073, US-074, US-075 e US-081.
- Secoes 4, 5, 6.3, 7 e 8 da especificacao: US-061, US-062, US-063, US-064, US-065, US-066, US-067, US-068, US-069, US-081 e US-082.
- Secao 9 da especificacao: ordem recomendada de execucao deste epic.
- Secao 10 da especificacao: principio de separacao entre conversa externa, chat interno e historico oficial.

## Ordem recomendada de execucao

1. US-061 e US-062, para criar a base do registro de atendimento e controlar mensagens ja registradas.
2. US-063, US-064 e US-065, para substituir o resumo acumulado pelo fluxo revisado de registro de atendimento.
3. US-066, US-067, US-068 e US-069, para disponibilizar o historico na ficha do lead e no Kanban.
4. US-070, US-071, US-072, US-073, US-074 e US-075, para entregar o chat interno e a discussao vinculada ao lead.
5. US-076, US-077, US-078, US-079 e US-080, para entregar importacao padronizada de leads.
6. US-081, US-082 e US-083 devem acompanhar as fases anteriores como requisitos transversais de permissao, auditoria, contrato de API e qualidade.
