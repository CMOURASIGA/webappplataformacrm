# CRM Flow - AI Spec

## 1. Princípio

A IA do CRM Flow deve ser contextual e operacional. Ela não deve existir apenas como um chat genérico separado da operação.

## 2. Casos de uso prioritários

- resumir atendimento;
- resumir histórico do lead;
- identificar intenção;
- sugerir próxima ação;
- sugerir resposta;
- classificar lead;
- identificar oportunidade parada;
- preparar follow-up;
- gerar nota de atendimento;
- sugerir criação de atividade;
- apoiar análise do pipeline;
- apoiar supervisor na leitura de volume e gargalos.

## 3. Contexto permitido

A IA pode receber contexto estritamente necessário para a tarefa, respeitando tenant e permissão.

Exemplos:

- dados básicos do lead;
- histórico de conversa permitido;
- etapa atual;
- atividades;
- tags;
- origem;
- responsável;
- dados do pipeline.

Nunca enviar dados de outro tenant.

## 4. Ação assistida x ação automática

Como regra inicial, ações que alteram estado comercial devem exigir confirmação do usuário.

Exemplos:

IA pode sugerir:

- mover para Proposta;
- criar tarefa amanhã;
- marcar follow-up;
- classificar intenção.

A aplicação deve apresentar a sugestão e permitir confirmar ou rejeitar antes da mudança, salvo automação explicitamente configurada e auditável no futuro.

## 5. UI de IA

A IA deve aparecer dentro do contexto onde gera valor.

Exemplos:

### Conversa

- Resumir conversa;
- Sugerir resposta;
- Extrair próxima ação.

### Lead Workspace

- Resumo inteligente;
- Risco de oportunidade parada;
- Sugestão de follow-up.

### Dashboard

- Alertas gerenciais baseados em dados disponíveis, sem inventar informações.

## 6. Transparência

Diferenciar claramente:

- dado real do CRM;
- cálculo do sistema;
- sugestão gerada por IA.

Não apresentar inferência como fato confirmado.

## 7. Segurança

- sanitizar conteúdo antes de renderizar quando aplicável;
- limitar contexto por tenant;
- evitar exposição de prompt interno, credenciais e segredos;
- não registrar conteúdo sensível sem política definida;
- tratar falha do provedor sem bloquear o CRM.

## 8. Falha graciosa

Se a IA estiver indisponível:

- operação principal do CRM continua funcionando;
- mostrar mensagem objetiva;
- permitir tentar novamente;
- não perder texto digitado pelo usuário.

## 9. Provedores

O projeto possui integração com mais de um provedor. A interface deve evitar acoplamento visual a um provedor específico.

Criar abstração de serviço quando houver manutenção dessa camada.

## 10. Métricas

Quando autorizado, acompanhar:

- chamadas;
- tokens ou unidade equivalente;
- custo estimado quando disponível;
- recurso acionado;
- tenant;
- usuário;
- sucesso/erro;
- latência.

## 11. Restrições

IA não deve:

- ignorar permissão do usuário;
- acessar outro tenant;
- mover lead silenciosamente sem regra explícita;
- apagar dados;
- substituir auditoria;
- inventar informações ausentes no CRM.
