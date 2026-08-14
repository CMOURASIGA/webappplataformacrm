# Backlog de User Stories

Baseado na especificacao em `documentacao/ESPECIFICACAO_INTEGRACAO_META_WHATSAPP_CONSULT_FLOW.md`.

Objetivo deste pacote:
- cobrir todo o escopo tecnico e funcional da integracao Meta WhatsApp;
- separar as historias por epico para facilitar planejamento e execucao;
- manter rastreabilidade entre a especificacao e o backlog.

## Estrutura

- [Epic 01 - Fundacao e seguranca](./epic-01-fundacao-seguranca.md)
- [Epic 02 - Onboarding Embedded Signup](./epic-02-onboarding.md)
- [Epic 03 - Mensagens e webhook](./epic-03-mensagens-webhook.md)
- [Epic 04 - Templates e janela de atendimento](./epic-04-templates.md)
- [Epic 05 - Frontend e operacao](./epic-05-frontend-operacao.md)
- [Epic 06 - Compatibilidade, qualidade e entrega](./epic-06-compatibilidade-qualidade.md)
- [Epic 07 - Validacao fase 1](./epic-07-validacao-fase-1.md)
- [Epic 08 - Manutencao dos indicadores e classificacao de leads](./epic-08-manutencao-classificacao-leads.md)
- [Epic 09 - Importacao, chat interno e historico de atendimento de leads](./epic-09-importacao-chat-historico-leads.md)

## Leitura rapida

Prioridade sugerida:
1. fundacao e seguranca;
2. onboarding oficial;
3. envio e recebimento;
4. templates e janela;
5. frontend e operacao;
6. compatibilidade, testes e entrega;
7. validacao fase 1 e estabilizacao do CRM;
8. manutencao dos indicadores, classificacao e exportacao de leads.
9. importacao de leads, chat interno e historico de atendimento por ciclo.

## Rastreabilidade

- Secoes 6, 8, 9 e 10 da especificacao: Epic 01.
- Secoes 7, 18, 19 e 20.1: Epic 02.
- Secoes 11, 12, 13, 20.3, 20.4 e 20.5: Epic 03.
- Secoes 13, 14 e 20.3: Epic 04.
- Secoes 5, 15, 17, 20.6 e 23: Epic 05.
- Secoes 16, 18, 21 e 22: Epic 06.
- Validacoes de estabilizacao e evolucao operacional da demonstracao: Epic 07 e Epic 08.
- Especificacao `especificacao_importacao_chat_historico_leads`: Epic 09.
