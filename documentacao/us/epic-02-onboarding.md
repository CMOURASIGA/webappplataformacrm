# Epic 02 - Onboarding Embedded Signup

## US-013 - Iniciar sessao de onboarding
Como administrador do tenant, quero iniciar uma sessao de Embedded Signup, para conectar a conta da Meta sem copiar credenciais manualmente.

Critérios de aceite:
- endpoint retorna `appId`, `configId`, `state` e expiracao;
- o `state` e aleatorio, seguro e vinculado ao tenant e ao usuario;
- states antigos sao invalidados quando aplicavel;
- a acao gera auditoria.

## US-014 - Concluir onboarding com authorization code
Como administrador do tenant, quero concluir o onboarding enviando `code`, `state` e dados da sessao, para ativar a conexao no backend.

Critérios de aceite:
- o backend valida o `state` e a expiracao;
- o `state` nao pode ser reutilizado;
- o authorization code e trocado por token no servidor;
- a conexao so fica `connected` apos validacoes obrigatorias.

## US-015 - Validar WABA e telefone
Como administrador do tenant, quero que o sistema confirme WABA e Phone Number ID, para garantir que o ativo pertence a conta autorizada.

Critérios de aceite:
- o sistema consulta os ativos autorizados pela Meta;
- o telefone e confirmado como pertencente ao WABA;
- dados tecnicos relevantes sao persistidos;
- falhas parciais ficam registradas.

## US-016 - Registrar telefone e inscrever aplicativo
Como administrador do tenant, quero que o sistema registre o telefone quando necessario e inscreva o aplicativo no WABA, para habilitar envio e recebimento.

Critérios de aceite:
- o backend executa a inscricao do aplicativo no WABA;
- o status de inscricao e salvo;
- o status do telefone e salvo;
- a conexao nao e marcada como operacional se essa etapa falhar.

## US-017 - Persistir onboarding com etapas e falhas
Como suporte tecnico, quero ver a etapa exata onde o onboarding parou, para retomar ou investigar falhas.

Critérios de aceite:
- existe `onboarding_status`, `onboarding_step`, `onboarding_error_code` e `onboarding_error_message`;
- a data de conclusao ou falha e registrada;
- o processo tenta ser transacional;
- falha parcial nao deixa conexao falsa como `connected`.

## US-018 - Reautorizar conexao
Como administrador do tenant, quero iniciar um novo onboarding quando a permissao expirar ou o ativo perder acesso, para restaurar a operacao.

Critérios de aceite:
- existe endpoint de inicio de reautorizacao;
- o fluxo reaproveita a mesma logica de onboarding;
- o estado anterior nao e sobrescrito sem controle;
- a tela oferece a acao para usuarios autorizados.

## US-019 - Processar desautorizacao da Meta
Como a plataforma, quero receber a desautorizacao enviada pela Meta, para bloquear novos envios quando a permissao for removida.

Critérios de aceite:
- o payload assinado e validado;
- a conexao e marcada como desconectada/inativa;
- o token e invalidado quando aplicavel;
- o historico de conversas nao e apagado.

## US-020 - Processar exclusao de dados
Como a plataforma, quero registrar e acompanhar pedidos de exclusao de dados, para atender a politica da Meta e obrigacoes legais.

Critérios de aceite:
- existe endpoint para solicitar exclusao;
- existe endpoint para consultar status por codigo de confirmacao;
- a resposta inclui acompanhamento e confirmacao;
- dados obrigatorios por lei podem ser preservados.

## US-021 - Suportar multiplos numeros por tenant
Como a plataforma, quero que a estrutura aceite um tenant com um ou mais numeros WhatsApp, para nao travar o crescimento futuro.

Critérios de aceite:
- o banco nao assume relacao fixa de um para um;
- a limitacao do plano e aplicada na regra comercial, nao na estrutura tecnica;
- o roteamento continua baseado em `phone_number_id`.
