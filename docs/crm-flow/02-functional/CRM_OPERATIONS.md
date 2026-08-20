# CRM Flow - Operação Funcional

## 1. Objetivo

Definir o comportamento esperado das principais áreas operacionais do CRM Flow durante a manutenção.

## 2. Dashboard

O Dashboard deve responder rapidamente:

- quantos leads estão ativos;
- quantas oportunidades foram ganhas e perdidas;
- como o funil está distribuído;
- quantas conversas estão abertas;
- quantos atendimentos aguardam resposta;
- quais atividades estão vencidas;
- quais indicadores exigem ação.

### Blocos recomendados

Linha 1:

- Leads Ativos;
- Oportunidades;
- Ganhos;
- Conversão.

Linha 2:

- Conversas Abertas;
- Aguardando Cliente;
- Tempo Médio de Atendimento;
- Atividades Vencidas.

Linha 3:

- Funil Comercial.

Linha 4:

- Atividades;
- Conversões;
- Origem dos Leads.

Consumo de IA deve ser visível para perfis autorizados, mas não dominar o Dashboard comercial.

## 3. Kanban

O Kanban continua como visão central do pipeline.

Deve preservar drag and drop entre etapas.

### Card do lead

Exibir, quando disponível:

- nome;
- empresa;
- origem;
- tags;
- valor da oportunidade;
- responsável;
- última interação;
- indicador de pendência;
- data relevante.

### Ações

- abrir Lead Workspace;
- iniciar ou continuar conversa;
- mover etapa;
- registrar atividade;
- editar dados conforme permissão.

Movimentações críticas podem exigir justificativa, especialmente Ganho ou Perdido quando a regra de negócio assim determinar.

## 4. Lista de Leads

Deve oferecer visão tabular e operacional.

Filtros mínimos previstos:

- busca textual;
- responsável;
- etapa;
- origem;
- status;
- período;
- tags.

Colunas recomendadas:

- Lead;
- Empresa;
- Etapa;
- Responsável;
- Valor;
- Última Interação;
- Status.

Clique na linha deve abrir Lead Workspace, salvo ação específica em controle interno da linha.

## 5. Lead Workspace

O Lead Workspace deve ser o contexto unificado do lead.

Preferência de implementação: drawer amplo em desktop.

### Abas ou seções

- Resumo;
- Conversas;
- Atividades;
- Arquivos, quando suportado.

### Resumo

Exibir:

- nome;
- telefone;
- e-mail;
- empresa;
- origem;
- pipeline;
- etapa;
- responsável;
- valor;
- tags;
- próxima atividade;
- observações relevantes.

### Histórico

Deve consolidar eventos relevantes em ordem cronológica, por exemplo:

- lead criado;
- mensagem recebida;
- mensagem enviada;
- mudança de etapa;
- atividade criada;
- atividade concluída;
- responsável alterado;
- nota adicionada;
- oportunidade ganha ou perdida.

## 6. Atendimento

Atendimento e CRM não devem funcionar como produtos desconectados.

Ao abrir uma conversa vinculada a lead, mostrar contexto comercial suficiente para o atendente decidir e agir.

Contexto mínimo:

- lead;
- etapa;
- responsável;
- tags;
- última interação;
- próxima atividade.

Ações desejadas sem sair da conversa:

- mover etapa;
- criar atividade;
- adicionar nota;
- alterar responsável, se permitido;
- abrir Lead Workspace.

## 7. Respostas Rápidas

Manter gestão administrativa das respostas rápidas.

No uso operacional:

- pesquisa simples;
- inserção rápida na conversa;
- organização por categoria quando volume justificar;
- respeitar tenant.

## 8. Configuração do Funil

Administrador deve conseguir:

- criar etapa;
- editar nome;
- reordenar;
- definir características visuais permitidas;
- inativar ou remover conforme regra segura.

Não permitir remoção destrutiva de etapa com leads sem tratamento explícito dos registros existentes.

## 9. Identidade Visual

Permitir configuração de logo, nome e cores suportadas.

Adicionar preview antes de salvar.

## 10. WhatsApp/Meta

A tela deve separar claramente:

- status da integração;
- dados de configuração;
- validação;
- erros;
- instruções de conexão;
- teste quando tecnicamente possível.

Segredos não devem ser exibidos integralmente após armazenamento.

## 11. Inteligência Artificial

Configuração de IA deve distinguir:

- provedor;
- modelo;
- recursos habilitados;
- limites ou controles de uso;
- comportamento por tenant;
- status de configuração.

## 12. Estados vazios

Nenhuma área operacional deve exibir apenas texto cru como `Nenhum funil encontrado`.

Estado vazio deve explicar:

- o que está vazio;
- por que isso importa;
- qual ação o usuário pode executar.
