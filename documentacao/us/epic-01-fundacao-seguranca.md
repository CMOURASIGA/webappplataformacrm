# Epic 01 - Fundacao e seguranca

## US-001 - Centralizar cliente da Meta
Como administrador tecnico, quero que todas as chamadas para a Meta usem um cliente unico e configurado por ambiente, para manter a integracao consistente e facil de manter.

Critérios de aceite:
- a versao da Graph API vem de variavel de ambiente;
- a base URL da Meta e os headers comuns sao centralizados;
- o `app secret proof` pode ser aplicado de forma consistente quando habilitado;
- erros da Meta sao mapeados em um unico ponto.

## US-002 - Validar configuracao obrigatoria
Como administrador tecnico, quero que o servidor valide as variaveis obrigatorias na inicializacao, para evitar subir com integracao incompleta.

Critérios de aceite:
- `META_APP_ID`, `META_APP_SECRET`, `META_CONFIG_ID`, `META_VERIFY_TOKEN`, `META_REDIRECT_URI`, `META_GRAPH_VERSION`, `TOKEN_ENCRYPTION_KEY` e `META_ONBOARDING_STATE_TTL_MINUTES` sao suportadas;
- quando configuracoes criticas faltarem, o sistema sinaliza indisponibilidade ou falha de bootstrap;
- nenhuma credencial secreta e exposta no frontend.

## US-003 - Criptografar tokens em repouso
Como administrador de seguranca, quero que o access token seja salvo criptografado, para que um acesso indevido ao banco nao exponha credenciais da Meta.

Critérios de aceite:
- o token e criptografado antes de persistir;
- o sistema consegue descriptografar apenas no servidor;
- nunca retornar token em endpoints de status;
- nunca registrar token em logs ou auditorias.

## US-004 - Restringir operacoes administrativas
Como dono do tenant, quero que as operacoes de conexao sejam permitidas apenas para usuarios autorizados, para proteger a integracao.

Critérios de aceite:
- iniciar onboarding exige usuario autenticado e perfil administrativo ou permissao equivalente;
- concluir onboarding, testar conexao, reautorizar e desconectar seguem a mesma regra;
- usuarios comuns nao acessam dados de conexao.

## US-005 - Validar webhook da Meta
Como administrador tecnico, quero que o webhook valide assinatura e desafio de verificacao, para bloquear chamadas forjadas.

Critérios de aceite:
- GET responde ao challenge apenas com `META_VERIFY_TOKEN` valido;
- POST valida assinatura HMAC conforme a especificacao;
- requests sem assinatura valida sao rejeitadas;
- payload invalido nao derruba o processo.

## US-006 - Aplicar App Secret Proof
Como administrador tecnico, quero reforcar as chamadas para a Meta com `app secret proof`, para reduzir risco de uso indevido do token.

Critérios de aceite:
- quando habilitado, o proof e incluido nas chamadas permitidas;
- o comportamento e controlado por ambiente;
- a ausencia do proof nao quebra o MVP, mas fica registrada como risco quando desabilitado.

## US-007 - Garantir isolamento por tenant
Como administrador da plataforma, quero que cada conexao WhatsApp fique vinculada a um unico tenant, para manter isolamento multiempresa.

Critérios de aceite:
- `tenant_id` e obrigatorio na conexao;
- `phone_number_id` nao pode ser associado a dois tenants;
- consultas de conexao respeitam o tenant, exceto o roteamento tecnico do webhook por `phone_number_id`.

## US-008 - Desconectar logicamente a conta
Como administrador do tenant, quero desconectar o WhatsApp sem apagar o historico, para preservar auditoria e conversas.

Critérios de aceite:
- a desconexao altera status para `disconnected`;
- `disconnected_at`, `token_revoked_at` e flags tecnicas sao atualizadas quando aplicavel;
- o registro nao e removido fisicamente;
- o sistema tenta revogar permissao e desinscrever webhook quando possivel.

## US-009 - Padronizar erros da integracao
Como suporte tecnico, quero ver erros da Meta normalizados, para acelerar diagnostico e atendimento.

Critérios de aceite:
- os erros possuem codigo interno e codigo da Meta quando existir;
- a mensagem exibida ao usuario e resumida;
- detalhes tecnicos ficam restritos a suporte/admin;
- falhas de onboarding, envio e webhook usam o mesmo padrao.

## US-010 - Registrar auditoria tecnica
Como auditor da plataforma, quero que toda acao critica da integracao gere eventos de auditoria, para reconstruir o que aconteceu.

Critérios de aceite:
- eventos de onboarding, teste, desconexao, desautorizacao, erro e sincronizacao sao registrados;
- payloads de auditoria sao sanitizados;
- tokens e segredos nunca entram na auditoria.

## US-011 - Evoluir a tabela de conexoes
Como equipe de produto, quero uma estrutura de banco preparada para o fluxo completo, para suportar onboarding, diagnostico e operacao.

Critérios de aceite:
- `whatsapp_connections` suporta status, ids da Meta, campos de verificacao, flags tecnicas, timestamps e erro corrente;
- a tabela suporta desconexao logica e reautorizacao;
- existe indice unico para `phone_number_id`.

## US-012 - Criar tabelas de onboarding e eventos
Como equipe tecnica, quero tabelas especificas para sessoes de onboarding e eventos de integracao, para manter rastreabilidade e idempotencia.

Critérios de aceite:
- existe tabela de sessoes com `state_hash`, expiracao e uso unico;
- existe tabela de eventos tecnicos da integracao;
- ha indice unico para impedir reuse de state;
- os eventos nao armazenam token nem segredo.
