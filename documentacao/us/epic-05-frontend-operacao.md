# Epic 05 - Frontend e operacao

## US-033 - Substituir formulario manual por Embedded Signup
Como administrador do tenant, quero conectar o WhatsApp pela interface oficial da Meta, para nao depender de copiar token, WABA ID e Phone Number ID manualmente.

Critérios de aceite:
- a tela principal nao exibe campos manuais para clientes comuns;
- existe botao `Conectar com a Meta`;
- o frontend solicita sessao de onboarding ao backend;
- o SDK oficial da Meta e carregado e aberto.

## US-034 - Exibir estados visuais da integracao
Como administrador do tenant, quero ver estados claros da conexao, para saber se estou conectado, validando ou com falha.

Critérios de aceite:
- a tela suporta `not_connected`, `onboarding_started`, `waiting_meta`, `validating`, `registering_phone`, `subscribing_webhook`, `connected`, `connected_warning`, `reauthorization_required`, `token_invalid`, `phone_not_registered`, `webhook_inactive`, `disconnected` e `failed`;
- o estado conectado mostra os dados tecnicos permitidos;
- o estado de alerta fica visualmente diferenciado;
- a tela recarrega com o status atual do backend.

## US-035 - Exibir diagnostico e teste de conexao
Como suporte tecnico, quero uma tela de diagnostico e um teste de conexao, para validar rapidamente a saude da integracao.

Critérios de aceite:
- existe area de diagnostico com checks de app, token, WABA, telefone, inscricao, webhook e permissao de envio;
- cada falha mostra codigo interno, codigo Meta e mensagem resumida;
- existe acao para testar a conexao;
- a tela informa ultima mensagem recebida, enviada e ultimo status.

## US-036 - Limpar a experiencia comum
Como usuario do CRM, quero que a area comum nao mostre campos tecnicos desnecessarios, para manter a experiencia simples.

Critérios de aceite:
- campos de token, WABA e Phone Number ID sao removidos da jornada padrao;
- a navegacao aponta para a nova experiencia de WhatsApp/Meta;
- a configuracao manual, se existir, fica restrita a area tecnica;
- o menu e a tela principal refletem o novo fluxo.

## US-037 - Disponibilizar acoes operacionais no painel
Como administrador do tenant, quero ter botoes de operacao, para manter a integracao sem abrir o banco.

Critérios de aceite:
- existem acoes de testar conexao, atualizar status, gerenciar modelos, reautorizar e desconectar;
- os botoes respeitam permissao administrativa;
- o estado da interface muda conforme o backend responde;
- erros sao exibidos de forma util ao operador.
