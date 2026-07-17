# Epic 08 - Manutencao dos indicadores e classificacao de leads

Baseado nas novas validacoes levantadas na demonstracao da plataforma.

Este epic consolida as manutencoes necessarias para estabilizar a experiencia de uso do CRM, corrigir erros visuais e funcionais apontados nos indicadores e nas acoes de conversa, e garantir que a classificacao do lead fique persistida na ficha para uso operacional e exportacao.

## Status da execucao

Implementado e validado tecnicamente em 17/07/2026. Disponivel para validacao funcional do cliente.

Entregas realizadas:
- indicadores das dashboards Master e do cliente corrigidos, normalizados e com tratamento de falha;
- acoes de Classificar e Resumir sem alertas genericos e com retorno tratado na conversa;
- classificacao `frio`, `morno` ou `quente` persistida na ficha e sincronizada com a IA;
- classificacao editavel e visivel na listagem de leads;
- filtro por classificacao e exportacao CSV compativel com Excel, com campos para publico da Meta;
- migracao automatica da base existente e controle de acesso por cliente mantidos.

Validacoes executadas:
- TypeScript (`npm run lint`): aprovado;
- build de producao (`npm run build`): aprovado;
- health check e contratos das dashboards: aprovados;
- criacao, alteracao e nova leitura da classificacao via API: aprovadas;
- registro temporario usado no teste de persistencia: removido ao final.

## US-056 - Corrigir os erros exibidos nos indicadores da dashboard
Como usuario da plataforma, quero visualizar os indicadores com os valores corretos e sem mensagens de erro, para confiar nos dados exibidos na tela inicial.

Criterios de aceite:
- os cards da dashboard exibem textos e valores renderizados corretamente;
- nao aparecem variaveis cruas como `${...}` ou placeholders quebrados na interface;
- quando um dado nao existir, a tela mostra zero, vazio ou mensagem tratada, sem erro tecnico;
- o carregamento parcial de dados nao quebra os demais indicadores;
- erros de API ou de montagem de dados sao tratados com mensagem amigavel e sem travar a pagina.

## US-057 - Estabilizar as acoes de Classificar e Resumir conversa
Como atendente, quero usar os botoes de `Classificar` e `Resumir` sem receber erro ao clicar, para executar as tarefas de atendimento sem interrupcao.

Criterios de aceite:
- os botoes executam a acao esperada sem alerta de erro generico;
- em caso de indisponibilidade da API, a interface exibe a causa de forma clara;
- a acao nao deixa a tela em estado inconsistente;
- o fluxo continua utilizavel mesmo se a operacao falhar;
- logs tecnicos suficientes ficam disponiveis para diagnostico sem expor detalhes internos ao usuario.

## US-058 - Persistir a classificacao do lead na ficha
Como usuario autorizado, quero que a classificacao do lead fique salva na ficha dele, para consultar o historico e usar esse dado em processos comerciais.

Criterios de aceite:
- a classificacao pode ser definida e alterada na ficha do lead;
- o valor salvo permanece disponivel apos refresh e nova abertura da ficha;
- a classificacao fica acessivel na listagem e no detalhe do lead;
- a interface mostra a classificacao atual sem depender apenas da conversa;
- a regra de permissao continua respeitando os perfis de acesso.

## US-059 - Permitir exportacao de leads por classificacao
Como usuario de operacao ou comercial, quero baixar uma planilha Excel com os leads e sua classificacao, para subir publicos segmentados na Meta e criar campanhas.

Criterios de aceite:
- a exportacao inclui a coluna de classificacao do lead;
- o arquivo gerado segue formato Excel ou compativel com planilha;
- filtros por classificacao podem ser aplicados antes da exportacao;
- os dados exportados respeitam permissao de acesso e escopo do cliente;
- o arquivo contem informacoes suficientes para uso em audiencia personalizada na Meta, sem quebrar a estrutura da planilha.

## US-060 - Garantir consistencia entre conversa, ficha do lead e exportacao
Como time comercial, quero que a classificacao registrada em conversa, ficha e exportacao siga a mesma fonte de verdade, para evitar divergencia de dados.

Criterios de aceite:
- a classificacao registrada na conversa atualiza a ficha do lead quando aplicavel;
- a ficha do lead exibe a mesma classificacao persistida no banco;
- a exportacao utiliza o mesmo valor salvo na base;
- nao existem duas classificacoes conflitantes para o mesmo lead sem regra clara de prioridade;
- o comportamento e documentado para o time de desenvolvimento.

## Rastreabilidade

- Validacao 1: indicadores da dashboard com erro visual e placeholders quebrados: US-056.
- Validacao 2: botoes `Classificar` e `Resumir` retornando erro ao clicar: US-057.
- Validacao 3: classificacao do lead na ficha e exportacao por classificacao para uso na Meta: US-058 e US-059.
- Validacao 4: coerencia entre conversa, ficha e exportacao: US-060.

## Ordem recomendada de execucao

1. US-056, para estabilizar a dashboard.
2. US-057, para corrigir as acoes de conversa com erro.
3. US-058, para persistir a classificacao do lead na ficha.
4. US-060, para alinhar a fonte de verdade dos dados.
5. US-059, para liberar a exportacao com classificacao.
