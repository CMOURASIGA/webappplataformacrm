# Consult Flow CRM, MVP de demonstração

## Estratégia das branches

- `develop`: desenvolvimento e validação.
- `mvp`: versão aprovada para demonstração.
- `cliente-base`: base que receberá persistência em nuvem e personalizações contratadas.

## Funcionamento do MVP

O frontend opera com dados demonstrativos em `localStorage` e memória do navegador. Alterações feitas durante a navegação permitem demonstrar o produto, mas a história comercial original é restaurada quando a aplicação é recarregada.

O MVP inclui dashboard, leads, Kanban, conversas, histórico de atendimento, anexos vinculados ao lead, usuários com três perfis e automações parametrizáveis.

Os dados comerciais não dependem de banco de dados no modo demonstrativo. A IA é a única operação que passa pelo servidor, para que a chave nunca seja exposta no navegador.

## Variáveis da Vercel

Obrigatória para as ações de IA:

```env
OPENAI_API_KEY=sk-...
```

O servidor também aceita `OPENAI_DEFAULT_MODEL`, usando `gpt-4o-mini` por padrão. As variáveis legadas `JWT_SECRET` e `TOKEN_ENCRYPTION_KEY` continuam necessárias enquanto os endpoints antigos de banco e integrações permanecerem no projeto.

## Como testar as funcionalidades de Inteligência Artificial:

1. Configure sua chave da OpenAI no painel em `.env` (`OPENAI_API_KEY=sk-...`)
2. Acesse a conta de um Cliente Administrador.
3. Acesse **Configurações > Inteligência Artificial**.
4. Habilite a IA, escolha o modelo, defina as regras de negócio e tom de voz. Salve.
5. Acesse **Chat / Mensagens > Conversas**.
6. Selecione uma conversa e utilize os botões:
    - **IA Sugerir**: no campo de chat, para gerar uma sugestão baseada no histórico.
    - **Classificar Lead**: no topo, para entender a intenção do cliente e extrair um resumo da intenção.
    - **Resumir**: no topo, para ter um resumo da conversa e pendências.
7. Faça login como **Master Admin**.
8. Acesse **Uso de IA** para monitorar o consumo (tokens), status e modelo utilizado por cada cliente cadastrado.
