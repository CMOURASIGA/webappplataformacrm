# Validacao Operacional - Epic 09

Checklist para conferencia manual do que foi implementado no Epic 09.
Itens sem marcacao permanecem pendentes de validacao.

## 1. Importacao de leads

| Ponto | OK | Nao OK | Observacoes |
|---|---|---|---|
| Tela de importacao disponivel para usuarios com permissao | [ ] | [ ] | |
| Download do template CSV funcionando | [x] | [ ] | |
| Upload de CSV funcionando | [x] | [ ] | |
| Upload de XLSX funcionando | [x] | [ ] | |
| Validacao de colunas obrigatorias | [x] | [ ] | |
| Validacao de telefone | [x] | [ ] | |
| Validacao de email | [x] | [ ] | |
| Validacao de pipeline | [x] | [ ] | |
| Validacao de etapa do funil | [x] | [ ] | |
| Validacao de responsavel | [x] | [ ] | |
| Validacao de tags | [x] | [ ] | |
| Previa com total de validos, erros e duplicados | [ ] | [ ] | |
| Tratamento de duplicados com opcao ignorar | [x] | [ ] | |
| Tratamento de duplicados com opcao atualizar | [x] | [ ] | |
| Tratamento de duplicados com opcao criar | [x] | [ ] | |
| Execucao cria lead, conversa, etapa, responsavel, tags, observacoes e origem | [ ] | [ ] | |
| Resultado final com contagem e relatorio de erros | [ ] | [ ] | |

## 2. Historico operacional do lead

| Ponto | OK | Nao OK | Observacoes |
|---|---|---|---|
| Drawer do lead abre corretamente | [ ] | [ ] | |
| Aba de Conversa disponivel | [ ] | [ ] | |
| Aba de Historico disponivel | [ ] | [ ] | |
| Aba de Discussao interna disponivel | [ ] | [ ] | |
| Aba de Dados disponivel | [ ] | [ ] | |
| Botao de historico na lista de leads funciona | [ ] | [ ] | |
| Botao de historico no kanban funciona | [ ] | [ ] | |
| Registro de atendimento com resumo | [ ] | [ ] | |
| Registro de atendimento com topicos | [ ] | [ ] | |
| Registro de atendimento com necessidades | [ ] | [ ] | |
| Registro de atendimento com objecoes | [ ] | [ ] | |
| Registro de atendimento com decisoes | [ ] | [ ] | |
| Registro de atendimento com pendencias | [ ] | [ ] | |
| Registro de atendimento com proximo passo | [ ] | [ ] | |
| Registro de atendimento com prazo | [ ] | [ ] | |
| Registro de atendimento com sentimento | [ ] | [ ] | |
| Salvamento so ocorre apos confirmacao do usuario | [ ] | [ ] | |
| Mesmo trecho de mensagens nao e duplicado | [ ] | [ ] | |
| E possivel criar novos registros com novas mensagens | [ ] | [ ] | |

## 3. Resumo por IA

| Ponto | OK | Nao OK | Observacoes |
|---|---|---|---|
| Preview do atendimento gerado por IA | [ ] | [ ] | |
| IA usa somente mensagens pendentes | [ ] | [ ] | |
| Mensagens ja tratadas nao sao reprocessadas | [ ] | [ ] | |
| Fluxo depende de IA habilitada no ambiente | [ ] | [ ] | |

## 4. Discussao interna

| Ponto | OK | Nao OK | Observacoes |
|---|---|---|---|
| Canal interno por lead disponivel | [ ] | [x] | tela em branco |
| Conversa interna nao envia para WhatsApp | [ ] | [x] | |
| Conversas diretas funcionam | [ ] | [x] | |
| Conversas em grupo funcionam | [ ] | [x] | |
| Mencoes em mensagens funcionam | [ ] | [x] | |
| Indicador de nao lidas funciona | [ ] | [x] | |
| Acesso pela tela do kanban funciona | [ ] | [x] | |
| Acesso pelo drawer do lead funciona | [ ] | [x] | |
| Registrar decisao a partir da discussao interna funciona | [ ] | [ ] | |

## 5. Kanban e lista de leads

| Ponto | OK | Nao OK | Observacoes |
|---|---|---|---|
| Icone para abrir conversa funciona | [ ] | [ ] | |
| Icone para abrir historico funciona | [ ] | [ ] | |
| Icone para abrir discussao interna funciona | [ ] | [ ] | |
| Indicador de ultimo atendimento aparece | [ ] | [ ] | |
| Indicador de atendente aparece | [ ] | [ ] | |
| Indicador de proximo passo aparece | [ ] | [ ] | |
| Indicador de atraso aparece | [ ] | [ ] | |
| Indicador de mensagens pendentes aparece | [ ] | [ ] | |

## 6. Permissoes e auditoria

| Ponto | OK | Nao OK | Observacoes |
|---|---|---|---|
| Admin consegue liberar permissao de importacao | [ ] | [ ] | |
| Usuario sem permissao nao consegue importar | [ ] | [ ] | |
| Acoes relevantes sao auditadas | [ ] | [ ] | |
| Isolamento por tenant preservado | [ ] | [ ] | |
