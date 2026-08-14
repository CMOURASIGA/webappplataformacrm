# Contratos de API - Epic 09

Todas as rotas exigem `Authorization: Bearer <token>`. Um usuario master deve informar `X-Tenant-ID`. Erros usam o formato `{ "error": "mensagem" }`.

## Registro e historico

- `GET /api/leads/service-overview`: retorna um objeto por `leadId` com `latest` e `pendingCount` para o Kanban.
- `GET /api/conversations/:conversationId/unregistered-messages`: retorna `count`, `firstMessage`, `lastMessage` e `messages` ainda elegiveis.
- `POST /api/conversations/:conversationId/service-records/preview`: gera a previa do ciclo pendente. Nao salva o registro.
- `POST /api/conversations/:conversationId/service-records`: salva a previa revisada. Exige `summary`, metadados do intervalo (`firstMessageId`, `lastMessageId`, `messageCount`, `startedAt`, `endedAt`) e aceita `topics`, `needs`, `objections`, `decisions`, `pendingItems`, `nextAction`, `nextActionDueAt` e `sentiment`.
- `GET /api/leads/:leadId/service-records`: lista o historico. Filtros: `period=all|today|7days`, `attendantId`, `pending=true` e `nextAction=true`.
- `GET /api/service-records/:recordId`: consulta um registro.
- `PUT /api/service-records/:recordId`: corrige um registro; restrito a administrador/master e auditado.

O salvamento retorna `409` se o conjunto de mensagens mudou ou ja foi registrado.

## Chat interno

- `GET /api/internal/channels`: lista canais acessiveis e `unreadCount`.
- `POST /api/internal/channels`: cria canal. Payload: `type`, `name`, `description`, `isPrivate` e `memberIds`. Tipos gerais: `direct`, `group` e `company`.
- `GET /api/internal/channels/:channelId/messages`: lista mensagens internas.
- `POST /api/internal/channels/:channelId/messages`: envia `{ "text": "...", "replyToMessageId": null }`.
- `POST /api/internal/channels/:channelId/read`: atualiza leitura e mencoes.
- `GET /api/internal/channels/:channelId/members`: lista membros.
- `POST /api/internal/channels/:channelId/members`: adiciona `{ "userId": "..." }`; restrito a administrador/master.
- `DELETE /api/internal/channels/:channelId/members/:userId`: remove membro; restrito a administrador/master.
- `GET /api/leads/:leadId/internal-channel`: obtem ou cria a discussao interna unica do lead.
- `POST /api/internal/channels/:channelId/service-record`: registra manualmente uma decisao no historico. Aceita `summary`, `decisions`, `pendingItems`, `nextAction` e `nextActionDueAt`.

Mensagens internas sao persistidas somente em `internal_messages` e nunca acionam integracoes externas.

## Importacao

- `GET /api/leads/import/template`: baixa o modelo CSV.
- `POST /api/leads/import/preview`: recebe `multipart/form-data`, campo `file`, nos formatos CSV ou XLSX.
- `POST /api/leads/import/execute`: recebe `fileName`, `duplicateMode` (`ignore`, `update` ou `create`) e as `rows` devolvidas pela previa. O backend revalida todas as linhas.
- `GET /api/leads/imports`: lista lotes. Administradores veem o tenant; atendentes autorizados veem os proprios lotes.
- `GET /api/leads/imports/:batchId`: retorna lote e linhas.
- `GET /api/leads/imports/:batchId/errors`: baixa CSV com linhas rejeitadas e duplicadas; retorna `204` quando nao existem erros.
- `PATCH /api/users/:userId/permissions`: define `{ "canImportLeads": true|false }`; restrito a administrador/master.

A previa retorna `totalRows`, `validRows`, `errorRows`, `duplicateRows` e `rows`. A execucao retorna `batchId`, `importedRows`, `duplicateRows`, `errorRows` e `status`.
