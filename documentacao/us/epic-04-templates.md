# Epic 04 - Templates e janela de atendimento

## US-029 - Gerenciar templates no CRM
Como administrador do tenant, quero cadastrar e visualizar templates do WhatsApp, para operar mensagens aprovadas dentro do CRM.

Critérios de aceite:
- existe cadastro local de templates por tenant;
- o template guarda nome, idioma, categoria, status e componentes;
- o estado do template e exibido no frontend;
- o fluxo suporta sincronizacao futura com a Meta.

## US-030 - Sincronizar templates com a Meta
Como administrador do tenant, quero sincronizar templates com a Meta, para manter o CRM alinhado com o que foi aprovado.

Critérios de aceite:
- o sistema consulta a Meta e atualiza a lista local;
- status e metadados sao mantidos;
- erros de sincronizacao sao registrados;
- a funcionalidade pode ser exposta no painel de operacao.

## US-031 - Enviar templates fora da janela
Como atendente, quero enviar templates aprovados quando a conversa estiver fora da janela, para continuar o atendimento sem violar regra da Meta.

Critérios de aceite:
- texto livre e bloqueado fora da janela;
- template aprovado e permitido;
- a regra e aplicada no backend;
- a mensagem deixa claro que se trata de um template quando necessario.

## US-032 - Exibir regras e estados de template
Como administrador do tenant, quero ver os estados e as regras dos templates, para entender quando posso usar cada modelo.

Critérios de aceite:
- o frontend mostra estados de template e orientacao de uso;
- o usuario entende quando a conversa esta fora da janela;
- a acao de gerenciar modelos fica acessivel apenas para quem tem permissão;
- a interface nao expõe segredos.
