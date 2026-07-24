# Especificação de Implementação
## Importação de Leads, Chat Interno e Histórico de Atendimento

## 1. Objetivo

Implementar três novos recursos no produto:

1. Importação padronizada de leads.
2. Chat interno entre atendentes e administradores.
3. Registro e consulta do histórico de atendimento do lead.

A implementação deve manter separados os seguintes conceitos:

- **Conversa externa:** interação com o lead por WhatsApp ou outros canais.
- **Chat interno:** comunicação privada entre usuários da plataforma.
- **Registro de atendimento:** resumo de um ciclo específico de atendimento.
- **Histórico de atendimento:** linha do tempo formada por todos os registros de atendimento do lead.

---

# 2. Importação de Leads

## 2.1 Requisito

Adicionar uma funcionalidade que permita importar leads por meio de um arquivo com colunas padronizadas.

A funcionalidade deve estar disponível na tela de leads por meio do botão:

```text
Importar leads
```

## 2.2 Formatos aceitos

Inicialmente:

- CSV
- XLSX

## 2.3 Modelo padrão de colunas

O sistema deve disponibilizar um arquivo modelo para download.

Colunas sugeridas:

| Coluna | Obrigatória | Descrição |
|---|---:|---|
| nome | Sim | Nome do lead |
| telefone | Sim | Telefone principal |
| email | Não | E-mail do lead |
| empresa | Não | Empresa ou instituição |
| origem | Não | Origem do lead |
| responsavel | Não | Atendente responsável |
| funil | Não | Funil de destino |
| etapa | Não | Etapa do funil |
| tags | Não | Tags separadas por vírgula |
| observacao | Não | Observação inicial |

## 2.4 Fluxo de importação

1. Usuário clica em `Importar leads`.
2. Sistema disponibiliza o modelo de arquivo.
3. Usuário envia um arquivo CSV ou XLSX.
4. Sistema valida as colunas.
5. Sistema apresenta uma prévia da importação.
6. Sistema identifica erros e possíveis duplicidades.
7. Usuário confirma a importação.
8. Sistema cria os leads válidos.
9. Sistema apresenta o resultado final.

## 2.5 Validações

Validar:

- Arquivo vazio.
- Formato inválido.
- Colunas obrigatórias ausentes.
- Nome ausente.
- Telefone ausente ou inválido.
- E-mail inválido.
- Funil inexistente.
- Etapa inexistente.
- Responsável inexistente.
- Leads duplicados.

## 2.6 Duplicidade

A duplicidade deve ser analisada prioritariamente por:

1. Telefone normalizado.
2. E-mail normalizado.
3. Combinação de telefone e e-mail.

Comportamentos disponíveis:

- Ignorar o registro duplicado.
- Atualizar o lead existente.
- Criar um novo lead.
- Analisar individualmente.

Comportamento padrão recomendado:

```text
Ignorar registros duplicados e apresentar relatório.
```

## 2.7 Resultado da importação

Exemplo:

```text
Total de linhas: 300
Leads importados: 272
Duplicidades ignoradas: 18
Registros com erro: 10
```

O sistema deve permitir baixar um relatório dos registros rejeitados.

## 2.8 Estrutura de banco sugerida

### Tabela `lead_import_batches`

```text
id
tenant_id
file_name
status
total_rows
imported_rows
duplicate_rows
error_rows
created_by
created_at
completed_at
settings_json
```

### Tabela `lead_import_rows`

```text
id
batch_id
row_number
raw_data_json
normalized_data_json
status
lead_id
error_message
created_at
```

---

# 3. Chat Interno

## 3.1 Requisito

Criar um chat interno dentro da plataforma para permitir a comunicação entre:

- Atendentes.
- Administradores.
- Grupos de usuários.
- Equipes.
- Usuários discutindo um lead específico.

O chat interno não deve enviar mensagens para o lead e não deve utilizar a estrutura da conversa de WhatsApp.

## 3.2 Tipos de conversa

### Conversa direta

Comunicação privada entre dois usuários.

Exemplos:

```text
Atendente ↔ Atendente
Atendente ↔ Administrador
Administrador ↔ Administrador
```

### Grupo ou canal

Exemplos:

```text
Todos
Comercial
Suporte
Administradores
Equipe da unidade
```

### Discussão vinculada ao lead

O usuário poderá iniciar uma conversa interna diretamente a partir de um lead.

Exemplo:

```text
Lead: Colégio Exemplo

Maria:
O cliente solicitou uma condição comercial diferente.

Carlos:
Vou verificar com o administrador.

Administrador:
Podemos aprovar até 10%.
```

Essa conversa deve permanecer privada para os usuários da plataforma.

## 3.3 Locais de acesso

O chat interno vinculado ao lead deve ser acessível em dois locais:

### Cadastro ou ficha do lead

Adicionar uma aba ou botão:

```text
Discussão interna
```

### Card do lead no funil Kanban

Adicionar uma ação rápida:

```text
Abrir discussão interna
```

Os dois acessos devem abrir a mesma conversa vinculada ao lead.

## 3.4 Funcionalidades iniciais

MVP:

- Mensagens de texto.
- Conversas diretas.
- Canais.
- Discussão vinculada ao lead.
- Menções com `@usuario`.
- Contador de mensagens não lidas.
- Data e hora da mensagem.
- Identificação do autor.
- Indicador de leitura.

Evoluções futuras:

- Anexos.
- Imagens.
- Respostas em sequência.
- Reações.
- Fixar mensagens.
- Pesquisa.
- Status online.
- Notificações push.

## 3.5 Relação com o histórico

As mensagens do chat interno não devem ser adicionadas automaticamente ao histórico do atendimento.

Adicionar uma ação manual:

```text
Registrar decisão no histórico
```

Essa ação permitirá transformar uma decisão relevante da conversa interna em um registro oficial do lead.

## 3.6 Estrutura de banco sugerida

### Tabela `internal_channels`

```text
id
tenant_id
name
description
type
lead_id
created_by
is_private
created_at
updated_at
```

Tipos possíveis:

```text
direct
group
company
lead
```

### Tabela `internal_channel_members`

```text
id
channel_id
user_id
role
joined_at
last_read_at
```

### Tabela `internal_messages`

```text
id
tenant_id
channel_id
sender_id
text
reply_to_message_id
created_at
edited_at
deleted_at
```

### Tabela `internal_message_mentions`

```text
id
message_id
mentioned_user_id
read_at
```

---

# 4. Registro de Atendimento

## 4.1 Conceito

O sistema atualmente possui um botão de resumo da conversa.

Esse botão deverá ser alterado para:

```text
Registrar atendimento
```

ou:

```text
Registrar histórico
```

Nome recomendado:

```text
Registrar atendimento
```

O botão deve gerar um resumo apenas das mensagens pertencentes ao ciclo de atendimento atual e que ainda não foram registradas.

## 4.2 Regra principal

O sistema não deve gerar um único resumo acumulado de toda a conversa.

Cada ciclo de atendimento deve gerar um registro separado.

Exemplo:

```text
21/07/2026, das 09:10 às 10:20
Atendente: Christian
Registro 1

21/07/2026, das 14:00 às 15:15
Atendente: Bianca
Registro 2

22/07/2026, das 11:30 às 12:10
Atendente: Carlos
Registro 3
```

Os registros podem ocorrer:

- Em dias diferentes.
- No mesmo dia.
- Com atendentes diferentes.
- Com o mesmo atendente em ciclos distintos.

## 4.3 Definição do ciclo de atendimento

Um ciclo de atendimento representa o intervalo entre:

- O início ou retomada do atendimento.
- O momento em que o atendente registra aquele atendimento.

O ciclo deve guardar:

- Atendente responsável.
- Data e hora inicial.
- Data e hora final.
- Primeira mensagem analisada.
- Última mensagem analisada.
- Quantidade de mensagens.
- Canal utilizado.
- Resumo gerado.
- Pendências.
- Próxima ação.

## 4.4 Controle das mensagens já registradas

Cada registro deve guardar o identificador da primeira e da última mensagem analisada.

Exemplo:

```text
first_message_id
last_message_id
```

Ao criar um novo registro, o sistema deve analisar somente as mensagens posteriores ao último registro.

O sistema deve impedir que uma mesma mensagem seja incluída em dois registros diferentes.

## 4.5 Cenário esperado

### Primeiro atendimento

Christian conversa com o lead das 14h às 16h.

Ao clicar em `Registrar atendimento`, a IA analisa somente as mensagens desse intervalo.

O sistema cria o Registro 1.

### Segundo atendimento

Bianca assume o lead no mesmo dia ou no dia seguinte.

Ela consulta o Registro 1, continua a conversa e, ao finalizar, clica em `Registrar atendimento`.

A IA analisa somente as mensagens posteriores ao Registro 1.

O sistema cria o Registro 2.

O conteúdo do Registro 1 não deve ser incluído novamente no Registro 2.

## 4.6 Conteúdo gerado pela IA

O registro deve conter:

```text
Resumo do atendimento
Assuntos tratados
Necessidades do lead
Objeções identificadas
Decisões tomadas
Pendências
Próxima ação
Sentimento ou percepção do atendimento
```

Exemplo:

```text
Resumo:
O cliente demonstrou interesse no produto e solicitou informações sobre integração e valores.

Assuntos tratados:
- Integração com WhatsApp
- Cadastro de atendentes
- Relatórios

Pendências:
- Enviar proposta comercial
- Validar prazo de implantação

Próxima ação:
Enviar proposta até 22/07/2026.
```

## 4.7 Revisão antes de salvar

O fluxo deve ser:

1. Usuário clica em `Registrar atendimento`.
2. IA analisa as mensagens ainda não registradas.
3. Sistema apresenta uma prévia.
4. Usuário pode editar o conteúdo.
5. Usuário confirma.
6. Sistema salva o registro no histórico.

A IA não deve salvar automaticamente sem revisão do usuário no MVP.

## 4.8 Indicador de mensagens pendentes

Na conversa deve existir um indicador:

```text
12 mensagens ainda não registradas
```

Se não houver mensagens novas:

```text
Não existem novas mensagens para registrar.
```

## 4.9 Estrutura de banco sugerida

### Tabela `lead_service_records`

```text
id
tenant_id
lead_id
conversation_id
attendant_id
started_at
ended_at
first_message_id
last_message_id
message_count
summary
topics_json
needs_json
objections_json
decisions_json
pending_items_json
next_action
sentiment
ai_model
generated_at
reviewed_by
reviewed_at
created_at
updated_at
```

---

# 5. Histórico de Atendimento

## 5.1 Conceito

O histórico de atendimento será a linha do tempo formada pelos registros de atendimento salvos.

O histórico não é uma conversa e não deve apresentar todas as mensagens do WhatsApp.

Ele deve apresentar os resumos consolidados de cada ciclo de atendimento.

## 5.2 Exibição na ficha do lead

Adicionar uma aba:

```text
Histórico de atendimento
```

Cada item deve apresentar:

- Data.
- Horário inicial e final.
- Atendente.
- Resumo.
- Pendências.
- Próxima ação.
- Quantidade de mensagens analisadas.
- Canal.
- Data de criação do registro.

Exemplo:

```text
21/07/2026, 14:00 às 16:00
Atendente: Christian
Canal: WhatsApp

Resumo:
Cliente solicitou uma apresentação do produto.

Pendências:
Enviar proposta comercial.

Próxima ação:
Retornar até 22/07/2026.
```

## 5.3 Exibição no funil Kanban

No card do lead, adicionar uma ação:

```text
Ver histórico de atendimento
```

Ao clicar, abrir um drawer ou painel lateral com:

```text
Resumo
Conversa
Histórico
Discussão interna
Dados do lead
```

A aba `Histórico` deve mostrar a mesma linha do tempo da ficha do lead.

## 5.4 Último atendimento

No card do Kanban, exibir opcionalmente:

- Data do último atendimento.
- Atendente responsável.
- Próxima ação.
- Quantidade de mensagens ainda não registradas.
- Indicador de pendência vencida.

Exemplo:

```text
Último atendimento: hoje às 16:00
Atendente: Christian
Próxima ação: enviar proposta
8 mensagens ainda não registradas
```

## 5.5 Filtros

Na tela do histórico:

```text
Todos
Hoje
Últimos 7 dias
Por atendente
Com pendências
Com próxima ação
```

---

# 6. APIs Sugeridas

## 6.1 Importação

```http
POST /api/leads/import/preview
POST /api/leads/import/execute
GET  /api/leads/imports
GET  /api/leads/imports/:batchId
GET  /api/leads/imports/:batchId/errors
```

## 6.2 Chat interno

```http
GET    /api/internal/channels
POST   /api/internal/channels
GET    /api/internal/channels/:channelId/messages
POST   /api/internal/channels/:channelId/messages
POST   /api/internal/channels/:channelId/members
DELETE /api/internal/channels/:channelId/members/:userId
GET    /api/leads/:leadId/internal-channel
```

## 6.3 Registro e histórico

```http
GET  /api/leads/:leadId/service-records
GET  /api/conversations/:conversationId/unregistered-messages
POST /api/conversations/:conversationId/service-records/preview
POST /api/conversations/:conversationId/service-records
PUT  /api/service-records/:recordId
GET  /api/service-records/:recordId
```

---

# 7. Regras de Permissão

## Atendente

Pode:

- Importar leads, caso tenha permissão específica.
- Conversar com usuários autorizados.
- Participar de canais.
- Criar discussões internas sobre leads aos quais possui acesso.
- Consultar o histórico dos leads aos quais possui acesso.
- Registrar seus atendimentos.
- Editar o registro antes da confirmação.

## Administrador

Pode:

- Importar leads.
- Consultar os lotes de importação.
- Criar canais e grupos.
- Adicionar e remover participantes.
- Consultar discussões internas.
- Consultar todos os históricos do tenant.
- Corrigir registros conforme política de auditoria.

## Auditoria

Toda alteração deve registrar:

```text
user_id
tenant_id
ação
data e hora
valor anterior
valor posterior
origem da ação
```

---

# 8. Critérios de Aceite

## Importação

- O usuário consegue baixar o modelo.
- O usuário consegue importar CSV e XLSX.
- O sistema identifica erros antes de salvar.
- O sistema identifica duplicidades.
- O sistema apresenta o resultado da importação.
- Os leads válidos aparecem no funil definido.

## Chat interno

- Um atendente consegue conversar com outro.
- Um atendente consegue conversar com um administrador.
- É possível criar grupos.
- É possível iniciar uma discussão a partir do lead.
- A mesma discussão pode ser acessada pela ficha e pelo Kanban.
- Nenhuma mensagem interna é enviada ao lead.

## Registro de atendimento

- O botão atual é alterado para `Registrar atendimento`.
- A IA analisa somente mensagens ainda não registradas.
- O usuário revisa o conteúdo antes de salvar.
- Um novo registro não repete mensagens de registros anteriores.
- É possível criar mais de um registro no mesmo dia.
- Cada registro identifica o atendente e o intervalo analisado.

## Histórico

- O histórico pode ser consultado na ficha do lead.
- O histórico pode ser consultado pelo card do Kanban.
- Os registros aparecem em ordem cronológica.
- Cada registro apresenta atendente, período, resumo, pendências e próxima ação.
- O sistema informa quando existem mensagens ainda não registradas.

---

# 9. Ordem Recomendada de Desenvolvimento

## Fase 1

- Criar estrutura de registros de atendimento.
- Controlar mensagens já registradas.
- Alterar o botão para `Registrar atendimento`.
- Gerar, revisar e salvar o resumo.

## Fase 2

- Criar histórico na ficha do lead.
- Criar histórico no drawer do Kanban.
- Criar indicadores de mensagens ainda não registradas.

## Fase 3

- Criar chat interno.
- Criar conversas diretas.
- Criar canais.
- Criar discussão vinculada ao lead.
- Criar notificações e menções.

## Fase 4

- Criar importação de leads.
- Criar modelo padrão.
- Criar validação.
- Criar controle de duplicidade.
- Criar relatório de erros.

---

# 10. Resumo da Arquitetura

```text
Conversa externa
    ↓
Mensagens ainda não registradas
    ↓
Registrar atendimento
    ↓
IA gera o resumo do ciclo atual
    ↓
Usuário revisa e confirma
    ↓
Registro de atendimento
    ↓
Histórico do lead
    ↓
Visualização na ficha e no Kanban
```

```text
Chat interno
    ↓
Conversa entre atendentes e administradores
    ↓
Pode estar vinculado a um lead
    ↓
Não aparece para o cliente
    ↓
Decisões importantes podem ser registradas manualmente no histórico
```

A implementação deve preservar a separação entre comunicação com o cliente, colaboração interna e documentação oficial do atendimento.
