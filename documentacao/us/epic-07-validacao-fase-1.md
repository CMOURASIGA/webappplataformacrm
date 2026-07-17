# Epic 07 - Validacao fase 1

Baseado no documento `documentacao/validacao do sistema fase 1`.

Este epic consolida as user stories necessarias para corrigir os problemas validos identificados na demonstracao, organizar as melhorias de usabilidade e preparar as evolucoes previstas no documento.

## Status da execucao

Implementado em 16/07/2026.

- US-043 a US-053 e US-055: implementadas no sistema.
- US-054: base de dados preparada e escopo futuro documentado em `documentacao/integracoes-captura-leads.md`, sem apresentar canais ainda inativos como integracoes disponiveis.
- Validacoes executadas: TypeScript, build de producao e inicializacao das migracoes SQLite em banco existente.

## US-043 - Corrigir tela branca ao assumir conversa da fila
Como atendente, quero assumir uma conversa da fila sem gerar tela branca, para continuar o atendimento sem perda de contexto.

Criterios de aceite:
- ao clicar em uma conversa da fila, a atribuicao conclui sem erro visual;
- o painel de mensagens abre com a conversa selecionada;
- o historico permanece disponivel apos o refresh;
- um erro em uma conversa nao derruba a tela inteira;
- em caso de falha da API, a interface exibe mensagem clara e continua funcional.

## US-044 - Garantir persistencia e visibilidade das conversas
Como atendente e administrador, quero que as conversas nao desaparecam da lista sem uma acao registrada, para manter rastreabilidade e continuidade do atendimento.

Criterios de aceite:
- uma conversa so sai da lista por encerramento, arquivamento, exclusao, transferencia ou mudanca de status registrada;
- a conversa atribuida aparece imediatamente em `Minhas`;
- apos refresh, o estado exibido continua igual ao estado salvo;
- conversas encerradas permanecem consultaveis no historico;
- o sistema diferencia claramente lead sem conversa, aguardando atendimento, em atendimento, encerrada e arquivada.

## US-045 - Restringir o filtro Todas por permissao
Como atendente, administrador e master, quero ver apenas as conversas permitidas para o meu perfil, para evitar acesso indevido a dados de outros usuarios ou clientes.

Criterios de aceite:
- atendente visualiza apenas `Minhas` e `Da fila`;
- administrador do cliente visualiza `Minhas`, `Da fila` e `Todas` do proprio cliente;
- master visualiza as conversas do cliente selecionado, respeitando isolamento entre clientes;
- o backend bloqueia consulta direta fora da permissao do usuario;
- a regra e aplicada tanto na interface quanto na API.

## US-046 - Permitir editar lead pela lista
Como usuario autorizado, quero editar um lead existente diretamente da lista, para corrigir dados sem precisar recriar o cadastro.

Criterios de aceite:
- ao clicar em editar, o formulario abre preenchido com os dados atuais;
- o usuario consegue alterar apenas os campos permitidos;
- a alteracao e validada antes de salvar;
- o backend persiste a edicao e a lista atualiza sem refresh;
- erros de validacao e de permissao sao exibidos ao usuario.

## US-047 - Reordenar estagios do funil por arrastar e soltar
Como administrador, quero reorganizar os estagios do funil por drag and drop, para ajustar a sequencia do processo comercial.

Criterios de aceite:
- qualquer estagio pode ser movido para outra posicao;
- a nova ordem e salva no banco;
- a ordem permanece igual apos refresh;
- os leads continuam vinculados aos seus respectivos estagios;
- nao existem posicoes duplicadas na sequencia gravada.

## US-048 - Inserir respostas rapidas durante o atendimento
Como atendente, quero localizar e inserir respostas rapidas durante uma conversa, para agilizar o atendimento sem perder a possibilidade de editar o texto.

Criterios de aceite:
- existe botao de respostas rapidas na caixa de mensagem;
- o usuario consegue pesquisar por nome, conteudo ou categoria;
- o texto e inserido no campo de mensagem e pode ser editado antes do envio;
- a categoria funciona como organizacao e filtro;
- o cadastro deixa claro que o modelo e inserido manualmente e nao enviado automaticamente.

## US-049 - Exibir o usuario autenticado e o cliente ativo separadamente
Como usuario do sistema, quero ver claramente quem esta autenticado e qual cliente esta ativo, para nao confundir identidade do usuario com contexto de operacao.

Criterios de aceite:
- usuario comum ve o proprio nome ou a indicacao equivalente de autenticacao;
- master ve o proprio usuario e o cliente selecionado em areas separadas;
- a troca de cliente continua restrita a quem tem permissao;
- o layout nao mistura contexto de usuario com contexto do cliente.

## US-050 - Remover ou desativar a busca global sem funcao
Como usuario do sistema, quero que a busca global so exista quando realmente retornar resultados, para nao interagir com um campo inutil.

Criterios de aceite:
- se a busca nao estiver implementada, o campo nao e exibido;
- se o campo permanecer, ele precisa retornar resultados validos;
- nenhum elemento visual simula funcionalidade inexistente;
- o comportamento e consistente no header em todas as telas afetadas.

## US-051 - Padronizar nomes e rotulos da interface em portugues
Como usuario do CRM, quero ver nomes e mensagens em portugues sempre que houver traducao clara, para entender a interface sem depender de termos tecnicos em ingles.

Criterios de aceite:
- o menu lateral e os titulos principais usam nomes padronizados em portugues;
- as telas e botoes mantem coerencia com os novos termos;
- mensagens de erro e confirmacao tambem seguem o mesmo padrao;
- termos tecnicos so permanecem quando houver justificativa clara.

## US-052 - Diferenciar origem manual e automatica do lead
Como usuario autorizado, quero registrar a origem real do lead e identificar quando ela foi informada manualmente, para nao confundir cadastro manual com integracao ativa.

Criterios de aceite:
- a origem do lead continua sendo registrada no cadastro;
- a interface indica quando a origem foi definida manualmente;
- o sistema permite cadastrar lead recebido por telefone;
- a lista de origens nao sugere integracao ativa quando ela nao existir;
- o historico da origem fica preservado.

## US-053 - Criar endpoint publico para captura de leads do site
Como time de operacao, quero receber leads por um endpoint publico seguro, para automatizar o cadastro vindo de formulario ou site.

Criterios de aceite:
- existe endpoint publico para receber leads;
- o endpoint identifica o cliente por chave ou token;
- o sistema cria ou atualiza o lead sem gerar duplicidade;
- a origem e registrada como `site` ou `formulario`;
- data, campanha e pagina de origem sao persistidas quando enviadas.

## US-054 - Planejar a entrada de leads do Instagram e da Meta
Como equipe de produto, quero deixar previsto o fluxo de entrada de leads vindos do Instagram e da Meta, para evoluir a captacao multicanal sem misturar isso com o cadastro manual.

Criterios de aceite:
- a documentacao diferencia o que ja esta ativo do que depende de integracao futura;
- a base funcional suporta evolucao para Instagram Direct, comentarios, anuncios e formularios instantaneos;
- a interface nao trata como ativo um canal que ainda nao foi integrado;
- o escopo inicial fica claramente separado da evolucao.

## US-055 - Criar base de ajuda contextual nas telas
Como usuario novo da plataforma, quero encontrar ajuda curta dentro das telas, para entender o que cada area faz sem depender de treinamento externo.

Criterios de aceite:
- as telas principais podem exibir icones ou acessos de ajuda;
- o conteudo responde o que e, para que serve, como usar e quem pode acessar;
- a central completa pode ser evoluida futuramente sem bloquear a entrega atual;
- o texto de ajuda e curto e orientado a tarefa.

## Rastreabilidade

- Secao 2.1 do documento: US-043.
- Secao 2.2 do documento: US-044.
- Secao 3.1 do documento: US-045.
- Secao 3.2 do documento: US-046.
- Secao 3.3 do documento: US-047.
- Secao 4.1 do documento: US-048.
- Secao 4.2 do documento: US-049.
- Secao 4.3 do documento: US-050.
- Secao 5.1 do documento: US-051.
- Secao 6.1 do documento: US-052, US-053 e US-054.
- Secao 7.1 do documento: US-055.

## Ordem recomendada de execucao

1. US-043 e US-044, para estabilizar o fluxo de conversas.
2. US-045 e US-046, para corrigir permissao e edicao de leads.
3. US-047, para reorganizacao do funil.
4. US-048, US-049, US-050 e US-051, para operacao e usabilidade.
5. US-052, US-053, US-054 e US-055, para evolucoes de origem e ajuda.
