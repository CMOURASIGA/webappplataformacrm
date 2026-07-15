# Especificação Técnica Final

## Integração da Consult Flow com a Meta WhatsApp Business Platform

**Projeto analisado:** `webappplataformacrm-main(1).zip`  
**Data da especificação:** 15/07/2026  
**Objetivo:** implementar o processo completo de conexão de uma empresa cliente com a Meta, configuração de um número de WhatsApp e operação de conversas dentro da Consult Flow.

---

## 1. Objetivo do desenvolvimento

A Consult Flow deve permitir que cada empresa cliente conecte sua própria conta da Meta e configure um número do WhatsApp Business diretamente pela plataforma.

O processo não deve exigir que o cliente copie manualmente os seguintes dados do painel da Meta:

- Access Token;
- WhatsApp Business Account ID, WABA ID;
- Phone Number ID;
- número de exibição.

O sistema deverá utilizar o processo oficial de onboarding da Meta, chamado **WhatsApp Embedded Signup**, para conduzir o cliente pelas etapas de:

1. autenticação na Meta;
2. seleção ou criação do portfólio empresarial;
3. seleção ou criação da conta do WhatsApp Business;
4. seleção ou cadastro de um telefone;
5. verificação do telefone;
6. autorização da Consult Flow;
7. retorno automático para a plataforma;
8. validação técnica da integração;
9. habilitação do envio e recebimento de mensagens.

---

## 2. Situação encontrada no projeto atual

A análise do código confirmou que o projeto já possui uma base inicial de integração.

### 2.1 Tela existente

Arquivo:

```text
src/pages/settings/WhatsAppSettings.tsx
```

A tela atual solicita manualmente:

- Phone Number ID;
- WABA ID;
- Access Token;
- número de exibição.

Essa tela deverá ser substituída por um fluxo guiado de conexão com a Meta.

### 2.2 Tabela existente

Arquivo:

```text
src/db/schema.sql
```

A tabela `whatsapp_connections` já possui campos básicos para armazenar:

- tenant;
- status da conexão;
- número de exibição;
- Phone Number ID;
- WABA ID;
- token;
- data de conexão.

A tabela poderá ser aproveitada, mas deverá ser ampliada conforme esta especificação.

### 2.3 Endpoint atual de conexão

Arquivo:

```text
server.ts
```

Endpoint atual:

```http
POST /api/whatsapp/connect
```

O endpoint recebe os dados manualmente e grava a conexão como `connected` sem validar de forma suficiente se:

- o token é válido;
- o WABA pertence ao token;
- o Phone Number ID pertence ao WABA;
- o telefone está registrado;
- o aplicativo está inscrito no WABA;
- o webhook está operacional.

### 2.4 Armazenamento atual do token

O campo se chama:

```text
access_token_encrypted
```

Porém, o código grava diretamente o valor recebido. Portanto, atualmente o token não está efetivamente criptografado.

Esse comportamento deve ser corrigido antes da utilização com clientes reais.

### 2.5 Envio de mensagens existente

O projeto já possui chamada para:

```text
https://graph.facebook.com/v19.0/{phone_number_id}/messages
```

A estrutura inicial poderá ser aproveitada, mas a versão da Graph API não pode permanecer fixa no código.

### 2.6 Webhook existente

O projeto já possui:

```http
GET /api/meta/webhook
POST /api/meta/webhook
```

O fluxo utiliza o `phone_number_id` recebido pela Meta para localizar a conexão e identificar o `tenant_id`.

Essa decisão arquitetural está correta para uma aplicação multiempresa.

### 2.7 Desconexão atual

O endpoint atual exclui fisicamente o registro da tabela `whatsapp_connections`.

Esse comportamento deve ser substituído por uma desconexão lógica, preservando histórico e auditoria.

---

## 3. Arquitetura funcional esperada

O fluxo principal deverá seguir esta estrutura:

```text
Usuário autenticado na Consult Flow
            ↓
Configurações > WhatsApp / Meta
            ↓
Botão "Conectar com a Meta"
            ↓
Backend gera state temporário vinculado ao tenant
            ↓
Frontend abre o WhatsApp Embedded Signup
            ↓
Cliente autentica e configura os ativos na Meta
            ↓
Meta devolve authorization code e dados da sessão
            ↓
Frontend envia o resultado ao backend
            ↓
Backend valida state e identifica o tenant
            ↓
Backend troca o code por token
            ↓
Backend recupera WABA e Phone Number ID
            ↓
Backend valida e registra o telefone
            ↓
Backend inscreve o aplicativo no WABA
            ↓
Backend salva a conexão criptografada
            ↓
Backend executa diagnóstico técnico
            ↓
Plataforma libera envio e recebimento de mensagens
```

---

## 4. Premissas multiempresa

A integração deverá respeitar o isolamento por tenant.

### 4.1 Regra principal

Cada conexão com a Meta deverá estar vinculada obrigatoriamente a um `tenant_id`.

### 4.2 Identificação de mensagens recebidas

O roteamento deverá seguir:

```text
phone_number_id recebido no webhook
            ↓
whatsapp_connections
            ↓
tenant_id
            ↓
lead, conversa e mensagem do tenant correto
```

### 4.3 Restrições obrigatórias

- um `phone_number_id` não poderá pertencer a dois tenants;
- nenhuma consulta de conexão poderá ocorrer sem filtro de tenant, exceto o roteamento técnico do webhook por `phone_number_id`;
- nenhum token poderá ser exposto para o frontend;
- nenhum usuário poderá acessar dados de conexão de outro tenant;
- ações de conexão, teste, reautorização e desconexão deverão exigir permissão administrativa.

### 4.4 Múltiplos números

A arquitetura deverá permitir futuramente:

```text
1 tenant
   ↓
1 ou vários números de WhatsApp
```

Mesmo que o plano inicial permita somente um número, o banco e os serviços não devem assumir definitivamente uma relação de um para um.

A limitação por plano deverá ser aplicada na regra comercial, não na estrutura técnica.

---

## 5. Experiência esperada no frontend

## 5.1 Estado não conectado

A tela deverá exibir:

```text
Conecte sua conta empresarial da Meta para utilizar o WhatsApp dentro da Consult Flow.
```

Botão principal:

```text
Conectar com a Meta
```

Não deverão ser exibidos campos manuais de token, WABA ID ou Phone Number ID para clientes comuns.

Uma configuração manual poderá existir apenas em área técnica restrita, caso seja realmente necessária para suporte.

## 5.2 Processo de conexão

Ao clicar em `Conectar com a Meta`, o sistema deverá:

1. solicitar ao backend uma sessão de onboarding;
2. receber `appId`, `configId` e `state`;
3. carregar o SDK oficial da Meta;
4. abrir o Embedded Signup;
5. acompanhar os eventos da janela;
6. capturar o authorization code;
7. capturar os dados de sessão fornecidos pela Meta;
8. enviar os dados ao endpoint de conclusão;
9. mostrar o andamento da validação;
10. atualizar a tela após a conclusão.

## 5.3 Estados visuais da integração

A tela deverá suportar pelo menos os seguintes estados:

- `not_connected` - não conectado;
- `onboarding_started` - onboarding iniciado;
- `waiting_meta` - aguardando conclusão na Meta;
- `validating` - validando ativos;
- `registering_phone` - registrando telefone;
- `subscribing_webhook` - ativando eventos;
- `connected` - conectado e operacional;
- `connected_warning` - conectado com alerta;
- `reauthorization_required` - reautorização necessária;
- `token_invalid` - token inválido;
- `phone_not_registered` - telefone não registrado;
- `webhook_inactive` - webhook inativo;
- `disconnected` - desconectado;
- `failed` - falha no onboarding.

## 5.4 Estado conectado

A tela deverá apresentar:

- número conectado;
- nome de exibição;
- nome verificado;
- WABA ID;
- Phone Number ID;
- Meta Business ID, quando disponível;
- status do telefone;
- status de verificação do código;
- status do nome;
- classificação de qualidade;
- status do webhook;
- data da conexão;
- data da última validação;
- data da última sincronização;
- última falha registrada.

Botões disponíveis:

- Testar conexão;
- Atualizar status;
- Gerenciar modelos;
- Reautorizar;
- Desconectar.

## 5.5 Tela de diagnóstico

Criar uma área de diagnóstico com o resultado de cada verificação:

```text
Aplicativo Meta: OK ou falha
Token: OK ou falha
Acesso ao WABA: OK ou falha
Acesso ao telefone: OK ou falha
Telefone registrado: OK ou falha
Aplicativo inscrito no WABA: OK ou falha
Webhook: OK ou falha
Permissão para enviar mensagens: OK ou falha
Última mensagem recebida: data e hora
Última mensagem enviada: data e hora
Último status recebido: data e hora
```

Cada falha deverá apresentar:

- código interno;
- código devolvido pela Meta;
- mensagem resumida para o usuário;
- detalhes técnicos disponíveis para administradores ou suporte.

---

## 6. Configurações de ambiente

Adicionar ao `.env.example`:

```env
META_APP_ID=
META_APP_SECRET=
META_CONFIG_ID=
META_VERIFY_TOKEN=
META_REDIRECT_URI=
META_GRAPH_VERSION=
META_APP_SECRET_PROOF_ENABLED=true
TOKEN_ENCRYPTION_KEY=
META_DATA_DELETION_STATUS_URL=
META_ONBOARDING_STATE_TTL_MINUTES=10
```

### 6.1 Regras

- `META_APP_ID`, `META_APP_SECRET` e `META_CONFIG_ID` pertencem à Consult Flow;
- essas credenciais não pertencem a cada tenant;
- `META_GRAPH_VERSION` deverá controlar a versão usada em todas as chamadas;
- `TOKEN_ENCRYPTION_KEY` deverá existir somente no servidor;
- nenhuma variável secreta poderá ser exposta no bundle do frontend;
- o servidor deverá falhar na inicialização ou marcar a integração como indisponível quando as configurações obrigatórias estiverem ausentes.

---

## 7. Novos endpoints obrigatórios

## 7.1 Iniciar onboarding

```http
POST /api/integrations/meta/signup/start
```

### Autorização

- usuário autenticado;
- usuário pertencente ao tenant;
- perfil administrativo ou permissão específica de integrações.

### Responsabilidades

1. identificar o tenant do usuário autenticado;
2. verificar limite de números contratado;
3. gerar um `state` aleatório e criptograficamente seguro;
4. salvar somente o hash do `state`, preferencialmente;
5. vincular o state ao tenant e ao usuário;
6. definir expiração curta;
7. invalidar states antigos não utilizados do mesmo processo;
8. registrar auditoria;
9. retornar os dados públicos necessários ao frontend.

### Resposta sugerida

```json
{
  "appId": "META_APP_ID",
  "configId": "META_CONFIG_ID",
  "state": "STATE_TEMPORARIO",
  "expiresAt": "2026-07-15T15:00:00Z"
}
```

## 7.2 Concluir onboarding

```http
POST /api/integrations/meta/signup/complete
```

### Entrada sugerida

```json
{
  "code": "AUTHORIZATION_CODE",
  "state": "STATE_TEMPORARIO",
  "sessionInfo": {
    "wabaId": "opcional, conforme retorno do SDK",
    "phoneNumberId": "opcional, conforme retorno do SDK",
    "businessId": "opcional, conforme retorno do SDK"
  }
}
```

### Responsabilidades

1. validar formato do payload;
2. localizar o state;
3. verificar se o state não expirou;
4. verificar se o state não foi utilizado;
5. comparar o hash do state;
6. identificar tenant e usuário;
7. trocar o authorization code por token;
8. validar o token com a Meta;
9. recuperar os ativos autorizados;
10. confirmar WABA ID;
11. confirmar Phone Number ID;
12. confirmar que o telefone pertence ao WABA;
13. consultar dados do telefone;
14. registrar o telefone, quando necessário;
15. inscrever o aplicativo no WABA;
16. salvar o token criptografado;
17. salvar os metadados da conexão;
18. marcar o state como utilizado;
19. executar diagnóstico inicial;
20. definir o status final;
21. registrar auditoria completa.

### Comportamento transacional

A conclusão deverá ser transacional sempre que possível.

Não deverá existir conexão marcada como `connected` caso alguma etapa obrigatória tenha falhado.

Em caso de falha parcial, salvar:

- etapa atingida;
- código de erro;
- mensagem de erro;
- data do erro;
- dados não sensíveis necessários para retomada.

## 7.3 Consultar status

```http
GET /api/integrations/meta/status
```

### Responsabilidades

- retornar as conexões do tenant;
- nunca retornar access token;
- retornar status local;
- retornar data da última validação na Meta;
- permitir atualização remota por parâmetro ou endpoint separado;
- indicar alertas e ações necessárias.

### Observação

A existência de um registro no banco não é suficiente para considerar a integração operacional.

## 7.4 Atualizar status remoto

```http
POST /api/integrations/meta/status/refresh
```

### Responsabilidades

Consultar a Meta e atualizar:

- validade do token;
- acesso ao WABA;
- acesso ao número;
- nome verificado;
- status do nome;
- status de registro;
- qualidade;
- inscrição do aplicativo;
- demais dados disponíveis.

## 7.5 Testar conexão

```http
POST /api/integrations/meta/test
```

### Testes mínimos

- token descriptografado com sucesso;
- token aceito pela Meta;
- WABA acessível;
- Phone Number ID acessível;
- telefone registrado;
- aplicativo inscrito no WABA;
- configuração de webhook existente;
- permissão de envio disponível.

### Teste opcional de mensagem

O endpoint poderá aceitar:

```json
{
  "destinationPhone": "5521999999999",
  "sendMessage": true
}
```

A mensagem deverá ser claramente identificada como teste.

## 7.6 Desconectar

```http
POST /api/integrations/meta/disconnect
```

### Comportamento obrigatório

Não excluir fisicamente a conexão.

Atualizar:

```text
connection_status = disconnected
disconnected_at = data atual
token_revoked_at = data atual, quando aplicável
webhook_subscribed = false
```

O sistema deverá tentar, conforme permissões disponíveis:

- remover a assinatura do aplicativo no WABA;
- revogar ou invalidar a autorização;
- impedir novos envios;
- manter auditoria e histórico.

## 7.7 Reautorizar

```http
POST /api/integrations/meta/reauthorize/start
```

Deverá iniciar novo Embedded Signup para corrigir:

- token inválido;
- permissão removida;
- ativo sem acesso;
- necessidade de nova autorização.

## 7.8 Desautorização enviada pela Meta

```http
POST /api/integrations/meta/deauthorize
```

### Responsabilidades

- validar o payload assinado;
- localizar a integração afetada;
- marcar como desconectada;
- inativar ou remover o token armazenado;
- impedir novos envios;
- registrar auditoria;
- não apagar automaticamente o histórico de conversas.

## 7.9 Exclusão de dados

```http
POST /api/integrations/meta/data-deletion
```

### Responsabilidades

- validar a solicitação assinada;
- gerar código de confirmação;
- registrar a solicitação;
- iniciar o processo de exclusão dos dados relacionados à integração, conforme política definida;
- retornar a URL de acompanhamento e o código de confirmação exigidos pela Meta;
- preservar somente informações que precisem ser mantidas por obrigação legal, quando aplicável.

## 7.10 Status da exclusão

```http
GET /api/integrations/meta/data-deletion/status/:confirmationCode
```

Deverá informar:

- solicitação recebida;
- em processamento;
- concluída;
- recusada com justificativa válida.

---

## 8. Banco de dados

## 8.1 Evolução da tabela `whatsapp_connections`

Sugestão de estrutura final:

```sql
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,

  provider TEXT NOT NULL DEFAULT 'meta',
  connection_status TEXT NOT NULL DEFAULT 'not_connected',

  meta_business_id TEXT,
  waba_id TEXT,
  phone_number_id TEXT,

  display_phone_number TEXT,
  verified_name TEXT,
  code_verification_status TEXT,
  name_status TEXT,
  quality_rating TEXT,
  platform_type TEXT,

  access_token_encrypted TEXT,
  access_token_iv TEXT,
  access_token_auth_tag TEXT,
  token_type TEXT,
  token_expires_at DATETIME,
  token_last_validated_at DATETIME,

  webhook_subscribed INTEGER NOT NULL DEFAULT 0,
  app_subscribed_to_waba INTEGER NOT NULL DEFAULT 0,
  phone_registered INTEGER NOT NULL DEFAULT 0,

  onboarding_status TEXT,
  onboarding_step TEXT,
  onboarding_error_code TEXT,
  onboarding_error_message TEXT,
  onboarding_completed_at DATETIME,

  last_sync_at DATETIME,
  last_health_check_at DATETIME,
  last_health_status TEXT,
  last_error_at DATETIME,

  connected_at DATETIME,
  disconnected_at DATETIME,
  token_revoked_at DATETIME,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE
);
```

### Índices obrigatórios

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_phone_number_unique
ON whatsapp_connections(phone_number_id)
WHERE phone_number_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_tenant
ON whatsapp_connections(tenant_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status
ON whatsapp_connections(connection_status);
```

## 8.2 Tabela de sessões de onboarding

```sql
CREATE TABLE IF NOT EXISTS meta_onboarding_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  state_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Índices

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_meta_onboarding_state_hash
ON meta_onboarding_sessions(state_hash);

CREATE INDEX IF NOT EXISTS idx_meta_onboarding_expiration
ON meta_onboarding_sessions(expires_at);
```

## 8.3 Tabela de eventos da integração

Criar para auditoria técnica:

```sql
CREATE TABLE IF NOT EXISTS meta_integration_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  connection_id TEXT,
  event_type TEXT NOT NULL,
  event_status TEXT,
  external_id TEXT,
  error_code TEXT,
  error_message TEXT,
  payload_sanitized TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
  FOREIGN KEY (connection_id) REFERENCES whatsapp_connections(id) ON DELETE SET NULL
);
```

Não armazenar tokens ou segredos no payload de auditoria.

## 8.4 Idempotência de mensagens

Criar índice único para impedir duplicidade de mensagens recebidas:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_external_id_unique
ON messages(external_message_id)
WHERE external_message_id IS NOT NULL;
```

Caso mensagens de canais diferentes possam compartilhar IDs, usar índice composto por:

```text
provider + external_message_id
```

## 8.5 Campos recomendados para mensagens

Adicionar ou confirmar a existência de:

- `external_message_id`;
- `provider`;
- `direction`;
- `message_type`;
- `status`;
- `sent_at`;
- `delivered_at`;
- `read_at`;
- `failed_at`;
- `error_code`;
- `error_message`;
- `template_name`;
- `template_language`;
- `reply_to_external_message_id`;
- `media_id`;
- `media_mime_type`;
- `media_filename`;
- `raw_payload_sanitized`.

---

## 9. Segurança obrigatória

## 9.1 Criptografia de tokens

O token deverá ser criptografado antes de ser gravado.

Recomendação:

- algoritmo autenticado, como AES-256-GCM;
- chave obtida de `TOKEN_ENCRYPTION_KEY`;
- IV aleatório por token;
- armazenamento separado de ciphertext, IV e authentication tag;
- descriptografia somente no momento da chamada à Meta;
- nunca registrar o token em logs;
- nunca retornar o token em APIs;
- nunca enviar o token para o frontend após a conclusão do onboarding.

## 9.2 Validação do webhook

O `POST /api/meta/webhook` deverá validar a assinatura enviada pela Meta.

Fluxo esperado:

```text
Corpo bruto da requisição
        ↓
Cálculo HMAC SHA-256 com META_APP_SECRET
        ↓
Comparação segura com a assinatura recebida
        ↓
Processamento somente quando válida
```

### Requisitos técnicos

- preservar o raw body antes do parser JSON;
- usar comparação de tempo constante;
- rejeitar assinatura ausente ou inválida;
- registrar somente informações sanitizadas;
- retornar código HTTP adequado;
- não processar o mesmo evento mais de uma vez.

## 9.3 Validação do GET do webhook

O endpoint de verificação deverá:

- validar `hub.mode`;
- comparar `hub.verify_token` com `META_VERIFY_TOKEN`;
- retornar `hub.challenge` somente quando válido;
- retornar `403` quando inválido.

## 9.4 State do onboarding

O `state` deverá:

- ser criptograficamente aleatório;
- ter uso único;
- expirar em poucos minutos;
- estar associado ao tenant e ao usuário;
- ser invalidado após utilização;
- não conter dados sensíveis em texto claro;
- ser comparado por hash, preferencialmente.

## 9.5 App Secret Proof

Quando suportado pelo endpoint utilizado, adicionar `appsecret_proof` calculado com o token e o App Secret.

## 9.6 Controle de acesso

Criar permissão específica, por exemplo:

```text
integrations.meta.manage
```

Somente usuários autorizados poderão:

- conectar;
- reautorizar;
- testar;
- sincronizar;
- desconectar;
- consultar detalhes técnicos.

## 9.7 Proteção de dados

- sanitizar payloads antes de gravar logs;
- mascarar telefones em logs técnicos quando possível;
- não salvar corpos completos de webhooks em logs comuns;
- definir política de retenção;
- manter trilha de auditoria para alterações da integração;
- aplicar requisitos de LGPD ao armazenamento e exclusão.

---

## 10. Serviço de integração com a Meta

Criar uma camada de serviço separada do controller HTTP.

Estrutura sugerida:

```text
src/
  services/
    meta/
      metaClient.ts
      metaAuthService.ts
      metaEmbeddedSignupService.ts
      metaWabaService.ts
      metaPhoneService.ts
      metaWebhookService.ts
      metaTemplateService.ts
      metaMessageService.ts
      metaTokenCryptoService.ts
      metaHealthCheckService.ts
      metaErrorMapper.ts
```

### Responsabilidades

#### `metaClient.ts`

- montar URL da Graph API;
- adicionar versão configurável;
- adicionar autenticação;
- adicionar appsecret_proof quando habilitado;
- aplicar timeout;
- tratar respostas HTTP;
- normalizar erros.

#### `metaAuthService.ts`

- trocar authorization code por token;
- validar token;
- consultar permissões;
- identificar expiração ou revogação.

#### `metaEmbeddedSignupService.ts`

- criar sessão de onboarding;
- validar state;
- processar resultado do SDK;
- coordenar conclusão.

#### `metaWabaService.ts`

- recuperar WABA;
- validar acesso;
- inscrever aplicativo;
- consultar assinatura.

#### `metaPhoneService.ts`

- recuperar números;
- consultar status;
- registrar telefone;
- consultar nome e qualidade.

#### `metaWebhookService.ts`

- validar assinatura;
- normalizar eventos;
- controlar idempotência;
- encaminhar mensagens e statuses.

#### `metaMessageService.ts`

- enviar texto;
- enviar template;
- enviar mídia;
- marcar como lida;
- mapear retorno da Meta.

#### `metaTokenCryptoService.ts`

- criptografar token;
- descriptografar token;
- validar configuração da chave.

#### `metaHealthCheckService.ts`

- executar diagnóstico;
- atualizar status local;
- retornar falhas e alertas.

#### `metaErrorMapper.ts`

- mapear erros da Meta para códigos internos;
- separar mensagem para usuário de detalhe técnico;
- evitar exposição de informações sensíveis.

---

## 11. Atualização do envio de mensagens

## 11.1 Versão da Graph API

Remover o valor fixo:

```text
v19.0
```

Usar:

```typescript
const graphVersion = process.env.META_GRAPH_VERSION;
const graphBaseUrl = `https://graph.facebook.com/${graphVersion}`;
```

Todas as chamadas deverão usar a mesma configuração central.

## 11.2 Status inicial da mensagem

Não iniciar uma mensagem como `sent` antes da confirmação da Meta.

Fluxo recomendado:

```text
pending
   ↓ resposta aceita pela Meta
sent
   ↓ webhook de entrega
delivered
   ↓ webhook de leitura
read
```

Em caso de erro:

```text
failed
```

## 11.3 Persistência antes do envio

Fluxo recomendado:

1. validar permissão do atendente;
2. validar tenant;
3. validar conversa;
4. validar conexão;
5. validar janela de atendimento;
6. criar mensagem local como `pending`;
7. chamar a Meta;
8. salvar o ID externo devolvido;
9. atualizar como `sent` quando aceito;
10. atualizar como `failed` quando rejeitado;
11. aguardar statuses do webhook.

## 11.4 Erros de envio

Salvar:

- código HTTP;
- código Meta;
- subcódigo Meta;
- título do erro;
- mensagem técnica sanitizada;
- mensagem amigável;
- data da falha.

## 11.5 Normalização do telefone

O número deverá ser salvo e enviado em padrão internacional, somente com dígitos.

Exemplo:

```text
5521999999999
```

Validar:

- DDI;
- DDD quando aplicável;
- quantidade mínima e máxima;
- remoção de espaços;
- remoção de parênteses;
- remoção de hífen;
- remoção do caractere `+` para envio à API, conforme formato utilizado internamente.

## 11.6 Janela de atendimento

A plataforma deverá controlar a janela de atendimento com base na última mensagem válida recebida do cliente.

Dentro da janela permitida:

- permitir mensagem livre;
- permitir mídia, conforme regras da Meta;
- permitir respostas normais do atendente ou automação.

Fora da janela:

- bloquear texto livre;
- exigir template aprovado;
- informar claramente o motivo ao atendente.

Mensagem sugerida:

```text
A janela de atendimento está encerrada. Selecione um modelo aprovado para iniciar uma nova conversa.
```

O cálculo da janela deverá ocorrer no backend. O frontend apenas refletirá a decisão.

---

## 12. Processamento do webhook

## 12.1 Processar todos os eventos

O código atual não deverá considerar apenas o primeiro item do array.

Processar todos os elementos de:

```typescript
change.value.messages || []
change.value.statuses || []
change.value.errors || []
```

## 12.2 Tipos de mensagem

Preparar tratamento para:

- text;
- image;
- audio;
- video;
- document;
- location;
- contacts;
- interactive;
- button;
- reaction;
- sticker;
- referral;
- unsupported.

## 12.3 Mensagens recebidas

Para cada mensagem:

1. identificar `phone_number_id`;
2. localizar conexão;
3. identificar tenant;
4. verificar duplicidade pelo ID externo;
5. normalizar telefone do remetente;
6. localizar ou criar lead;
7. localizar ou criar conversa;
8. interpretar tipo da mensagem;
9. persistir conteúdo e metadados;
10. atualizar data da última mensagem recebida;
11. reabrir janela de atendimento, quando aplicável;
12. disparar eventos internos necessários;
13. responder HTTP rapidamente.

## 12.4 Status de mensagens

Processar:

- sent;
- delivered;
- read;
- failed;
- deleted, quando aplicável;
- demais estados retornados pela Meta.

Localizar a mensagem por ID externo e atualizar:

- status;
- datas correspondentes;
- erro, quando houver;
- dados de cobrança ou conversa, caso o projeto venha a utilizar essas informações.

## 12.5 Resposta rápida do webhook

O endpoint não deverá manter a Meta aguardando enquanto realiza tarefas demoradas.

Recomendação:

1. validar assinatura;
2. validar estrutura mínima;
3. registrar evento idempotente;
4. responder `200` rapidamente;
5. processar tarefas posteriores por fila ou mecanismo assíncrono interno.

Caso o projeto ainda não possua fila, estruturar o código para futura adoção sem acoplar todo o processamento ao controller.

## 12.6 Mídia

Para mensagens com mídia:

1. capturar `media_id`;
2. solicitar metadados da mídia à Meta;
3. baixar o arquivo utilizando autenticação;
4. validar tamanho e MIME type;
5. armazenar em serviço de arquivos adequado;
6. salvar URL interna segura;
7. não depender permanentemente da URL temporária da Meta.

---

## 13. Templates de mensagem

A tabela ou estrutura existente de templates deverá ser integrada à Meta.

## 13.1 Funcionalidades mínimas

- sincronizar templates do WABA;
- exibir nome;
- exibir categoria;
- exibir idioma;
- exibir status;
- exibir conteúdo;
- exibir cabeçalho, corpo, rodapé e botões;
- exibir variáveis;
- exibir motivo de rejeição;
- selecionar template no chat;
- preencher variáveis;
- enviar template;
- atualizar status por sincronização.

## 13.2 Estados esperados

Tratar pelo menos:

- aprovado;
- pendente;
- rejeitado;
- pausado;
- desabilitado;
- em análise;
- demais estados devolvidos pela Meta.

## 13.3 Regras de envio

- fora da janela, somente templates permitidos;
- validar idioma e quantidade de variáveis;
- impedir envio com variáveis incompletas;
- salvar nome e idioma do template na mensagem;
- exibir falha da Meta de forma compreensível.

---

## 14. Tela de teste de conexão

Criar um fluxo de teste com as seguintes etapas:

1. validar autenticação;
2. validar WABA;
3. validar número;
4. validar webhook;
5. opcionalmente enviar mensagem para um número informado;
6. aguardar atualização por webhook;
7. mostrar evolução do status.

Exemplo visual:

```text
Conexão com a Meta: concluída
Mensagem aceita pela Meta: concluída
Mensagem entregue: aguardando
Mensagem lida: aguardando
```

O teste deverá possuir timeout visual e opção de atualizar o status.

---

## 15. Auditoria

Registrar as seguintes ações:

- início do onboarding;
- conclusão do onboarding;
- cancelamento pelo usuário;
- falha no onboarding;
- conexão criada;
- conexão atualizada;
- teste realizado;
- sincronização realizada;
- reautorização iniciada;
- token considerado inválido;
- desconexão;
- desautorização recebida;
- solicitação de exclusão;
- alteração de status crítico.

Cada registro deverá incluir:

- tenant;
- usuário, quando aplicável;
- ação;
- data e hora;
- conexão afetada;
- resultado;
- código do erro;
- metadados sanitizados.

---

## 16. Tratamento de erros

Criar códigos internos consistentes, por exemplo:

```text
META_CONFIG_MISSING
META_ONBOARDING_STATE_INVALID
META_ONBOARDING_STATE_EXPIRED
META_AUTH_CODE_INVALID
META_TOKEN_EXCHANGE_FAILED
META_TOKEN_INVALID
META_PERMISSION_MISSING
META_WABA_NOT_FOUND
META_PHONE_NOT_FOUND
META_PHONE_ALREADY_ASSIGNED
META_PHONE_NOT_REGISTERED
META_PHONE_REGISTRATION_FAILED
META_WABA_SUBSCRIPTION_FAILED
META_WEBHOOK_SIGNATURE_INVALID
META_MESSAGE_SEND_FAILED
META_TEMPLATE_NOT_APPROVED
META_CUSTOMER_SERVICE_WINDOW_CLOSED
META_RATE_LIMITED
META_API_UNAVAILABLE
```

A resposta das APIs deverá seguir um padrão:

```json
{
  "success": false,
  "error": {
    "code": "META_TOKEN_INVALID",
    "message": "A conexão com a Meta precisa ser autorizada novamente.",
    "technicalMessage": "Disponível somente para administradores ou logs seguros",
    "retryable": false
  }
}
```

---

## 17. Alterações no frontend atual

Arquivo principal:

```text
src/pages/settings/WhatsAppSettings.tsx
```

## 17.1 Remover da experiência comum

- campo de Access Token;
- campo de WABA ID;
- campo de Phone Number ID;
- botão que apenas salva os dados como conectados.

## 17.2 Adicionar

- botão `Conectar com a Meta`;
- carregamento do SDK;
- listener dos eventos do Embedded Signup;
- barra de etapas;
- estado de processamento;
- tratamento de cancelamento;
- tratamento de falha;
- cartão da conexão;
- diagnóstico;
- botão de atualização;
- botão de teste;
- botão de reautorização;
- confirmação antes da desconexão.

## 17.3 Exemplo conceitual

```typescript
async function handleMetaConnect() {
  const session = await api.post('/integrations/meta/signup/start');

  FB.login(
    async (response) => {
      const code = response?.authResponse?.code;

      if (!code) {
        handleSignupCancelledOrFailed(response);
        return;
      }

      await api.post('/integrations/meta/signup/complete', {
        code,
        state: session.state,
        sessionInfo: capturedSessionInfo,
      });

      await refreshIntegrationStatus();
    },
    {
      config_id: session.configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
        sessionInfoVersion: '3',
      },
    }
  );
}
```

A implementação deverá seguir a versão atual do SDK e do Embedded Signup configurada no aplicativo Meta.

---

## 18. Compatibilidade com o código atual

## 18.1 Endpoint antigo

O endpoint:

```http
POST /api/whatsapp/connect
```

Deverá ser:

- removido após migração;
- ou mantido temporariamente como rota administrativa protegida;
- ou redirecionado para a nova lógica sem aceitar token em texto pelo frontend comum.

## 18.2 Endpoint antigo de desconexão

O código que executa:

```sql
DELETE FROM whatsapp_connections
```

Deverá ser removido.

## 18.3 Status atual

O endpoint de status não poderá retornar:

- token;
- IV;
- auth tag;
- segredo;
- payload bruto sensível.

## 18.4 Migração de conexões existentes

Criar script de migração para:

1. adicionar novos campos;
2. identificar conexões antigas;
3. marcar conexões antigas como `legacy_manual`;
4. criptografar tokens existentes, caso ainda sejam válidos;
5. exigir reautorização quando não for possível validar a origem ou segurança;
6. preservar histórico.

---

## 19. Ordem recomendada de desenvolvimento

## Fase 1. Fundação e segurança

1. centralizar cliente da Meta;
2. tornar a versão da Graph API configurável;
3. implementar criptografia de tokens;
4. impedir retorno de token no status;
5. validar assinatura do webhook;
6. adicionar idempotência por ID externo;
7. substituir exclusão física por desconexão lógica;
8. padronizar erros;
9. adicionar auditoria.

### Resultado esperado

A integração manual atual deixa de possuir as principais falhas de segurança e consistência.

## Fase 2. Embedded Signup

1. configurar o Embedded Signup no aplicativo Meta;
2. criar tabela de sessões;
3. criar endpoint de início;
4. integrar o SDK no frontend;
5. capturar authorization code e session info;
6. criar endpoint de conclusão;
7. trocar code por token;
8. recuperar WABA e telefone;
9. registrar telefone quando necessário;
10. inscrever aplicativo no WABA;
11. salvar conexão por tenant;
12. executar diagnóstico inicial.

### Resultado esperado

O cliente conecta a conta e o telefone sem copiar IDs e tokens manualmente.

## Fase 3. Conversação completa

1. revisar envio de texto;
2. implementar status `pending`;
3. processar sent, delivered, read e failed;
4. processar todas as mensagens do webhook;
5. adicionar suporte a mídia;
6. normalizar telefone;
7. controlar janela de atendimento;
8. integrar templates;
9. melhorar mensagens de erro no chat.

### Resultado esperado

O tenant consegue enviar e receber mensagens de forma consistente dentro do CRM.

## Fase 4. Gestão e suporte

1. tela de diagnóstico;
2. teste de conexão;
3. sincronização de templates;
4. sincronização de qualidade e status do número;
5. reautorização;
6. desautorização;
7. exclusão de dados;
8. relatórios de falha;
9. alertas administrativos.

### Resultado esperado

A equipe consegue operar e dar suporte às integrações sem depender de análise manual do banco.

---

## 20. Critérios de aceite

## 20.1 Onboarding

- [ ] O usuário administrador consegue iniciar o onboarding pela Consult Flow.
- [ ] O sistema abre o Embedded Signup oficial da Meta.
- [ ] O cliente consegue selecionar ou criar os ativos empresariais.
- [ ] O cliente consegue selecionar ou cadastrar um telefone.
- [ ] O backend valida um state de uso único.
- [ ] O backend troca o authorization code por token.
- [ ] O backend identifica corretamente o tenant.
- [ ] O backend recupera e valida WABA ID e Phone Number ID.
- [ ] O backend confirma que o telefone pertence ao WABA.
- [ ] O aplicativo é inscrito no WABA.
- [ ] A conexão só fica `connected` após validações obrigatórias.
- [ ] Falhas parciais ficam registradas e visíveis.

## 20.2 Segurança

- [ ] O token não é salvo em texto puro.
- [ ] O token não aparece em respostas da API.
- [ ] O token não aparece em logs.
- [ ] O webhook valida assinatura.
- [ ] O state expira e não pode ser reutilizado.
- [ ] Apenas administradores podem gerenciar a integração.
- [ ] A conexão é isolada por tenant.
- [ ] Um Phone Number ID não pode ser associado a dois tenants.

## 20.3 Envio

- [ ] A versão da Graph API vem de variável de ambiente.
- [ ] A mensagem nasce como `pending`.
- [ ] O ID externo da Meta é persistido.
- [ ] A mensagem muda para `sent` após aceite.
- [ ] Falhas são persistidas com código e mensagem.
- [ ] O sistema valida a janela de atendimento no backend.
- [ ] Fora da janela, texto livre é bloqueado.
- [ ] Templates aprovados podem ser enviados.

## 20.4 Recebimento

- [ ] O webhook processa todas as mensagens do payload.
- [ ] Mensagens duplicadas não são gravadas novamente.
- [ ] O tenant é identificado pelo Phone Number ID.
- [ ] Lead e conversa são criados ou reutilizados corretamente.
- [ ] Tipos não suportados não derrubam o processamento.
- [ ] Mídias são tratadas de forma segura.

## 20.5 Status

- [ ] `sent`, `delivered`, `read` e `failed` são processados.
- [ ] As datas de cada status são persistidas.
- [ ] Erros da Meta são relacionados à mensagem correta.
- [ ] O frontend atualiza o status da conversa.

## 20.6 Gestão

- [ ] A tela apresenta dados da conexão sem segredos.
- [ ] O administrador consegue executar diagnóstico.
- [ ] O administrador consegue atualizar o status.
- [ ] O administrador consegue testar a conexão.
- [ ] O administrador consegue reautorizar.
- [ ] A desconexão não apaga o histórico.
- [ ] A desautorização da Meta é processada.
- [ ] A solicitação de exclusão possui confirmação e acompanhamento.

---

## 21. Cenários mínimos de teste

## Cenário 1. Conexão concluída

**Dado** um administrador autenticado  
**Quando** ele concluir o Embedded Signup com um número válido  
**Então** a conexão deverá ficar operacional e vinculada ao tenant correto.

## Cenário 2. Usuário cancela a Meta

**Quando** o usuário fechar ou cancelar o Embedded Signup  
**Então** nenhuma conexão deverá ser marcada como conectada.

## Cenário 3. State inválido

**Quando** o endpoint receber um state diferente do emitido  
**Então** deverá rejeitar a conclusão e registrar tentativa inválida.

## Cenário 4. State expirado

**Quando** a conclusão ocorrer depois da expiração  
**Então** deverá solicitar o reinício do onboarding.

## Cenário 5. State reutilizado

**Quando** o mesmo state for enviado novamente  
**Então** a segunda tentativa deverá ser rejeitada.

## Cenário 6. Token inválido

**Quando** a Meta rejeitar o token  
**Então** a conexão não deverá ficar operacional.

## Cenário 7. Número já utilizado por outro tenant

**Quando** um Phone Number ID já estiver associado a outro tenant  
**Então** o sistema deverá impedir a associação.

## Cenário 8. Webhook sem assinatura

**Quando** um POST chegar sem assinatura válida  
**Então** o payload não deverá ser processado.

## Cenário 9. Webhook duplicado

**Quando** a Meta reenviar o mesmo evento  
**Então** nenhuma mensagem duplicada deverá ser criada.

## Cenário 10. Várias mensagens no mesmo payload

**Quando** o payload contiver mais de uma mensagem  
**Então** todas deverão ser processadas individualmente.

## Cenário 11. Envio dentro da janela

**Quando** a conversa estiver dentro da janela  
**Então** o atendente poderá enviar texto livre.

## Cenário 12. Envio fora da janela

**Quando** a conversa estiver fora da janela  
**Então** o backend deverá bloquear texto livre e exigir template.

## Cenário 13. Status entregue

**Quando** a Meta enviar `delivered`  
**Então** a mensagem correta deverá ser atualizada.

## Cenário 14. Status lido

**Quando** a Meta enviar `read`  
**Então** a mensagem correta deverá receber `read_at`.

## Cenário 15. Falha de envio

**Quando** a Meta retornar erro  
**Então** a mensagem deverá ficar `failed` com detalhes sanitizados.

## Cenário 16. Desconexão

**Quando** o administrador desconectar  
**Então** a conexão ficará inativa sem apagar conversas e auditoria.

## Cenário 17. Desautorização pela Meta

**Quando** a Meta informar que o aplicativo foi removido  
**Então** o token deverá ser inativado e novos envios bloqueados.

## Cenário 18. Isolamento de tenant

**Quando** dois tenants possuírem números diferentes  
**Então** cada mensagem deverá ser gravada exclusivamente no tenant identificado pelo Phone Number ID.

---

## 22. Entregáveis esperados do desenvolvedor

1. migração de banco versionada;
2. atualização do `.env.example`;
3. serviços de integração com a Meta;
4. endpoints descritos nesta especificação;
5. integração do Embedded Signup no frontend;
6. nova tela de configuração;
7. tela ou seção de diagnóstico;
8. tratamento de mensagens e statuses no webhook;
9. criptografia de tokens;
10. validação de assinatura;
11. testes automatizados unitários;
12. testes automatizados de integração;
13. documentação de configuração do aplicativo Meta;
14. documentação de implantação;
15. documentação de variáveis de ambiente;
16. roteiro de teste manual;
17. evidências dos critérios de aceite;
18. plano de migração da integração manual atual.

---

## 23. Definition of Done

O desenvolvimento será considerado concluído quando:

- o onboarding puder ser realizado do início ao fim pela interface;
- nenhum dado técnico precisar ser copiado manualmente pelo cliente comum;
- o telefone estiver validado e associado ao tenant correto;
- mensagens puderem ser enviadas e recebidas;
- os statuses forem atualizados;
- a janela de atendimento for respeitada;
- templates puderem ser utilizados fora da janela;
- tokens estiverem criptografados;
- webhooks inválidos forem rejeitados;
- eventos duplicados forem tratados com idempotência;
- desconexões preservarem histórico;
- desautorização e exclusão de dados estiverem implementadas;
- todos os critérios de aceite prioritários estiverem testados;
- o processo estiver documentado para implantação e suporte.

---

## 24. Orientação final de prioridade

Não iniciar o trabalho apenas pela alteração visual da tela.

A sequência prioritária deverá ser:

1. segurança e criptografia;
2. cliente centralizado da Graph API;
3. validação e idempotência do webhook;
4. modelagem de conexão e onboarding;
5. Embedded Signup;
6. envio e recebimento completos;
7. janela de atendimento e templates;
8. diagnóstico, reautorização e suporte operacional.

A interface nova só deverá considerar uma integração como conectada quando o backend confirmar que os ativos da Meta estão acessíveis e operacionais.

