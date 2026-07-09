# SaaS CRM

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
