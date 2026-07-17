# Captura de leads

## Site e formulário - ativo

Use `POST /api/public/leads` com o token do cliente no cabeçalho `X-Capture-Token`. Administradores obtêm os dados de integração em `GET /api/tenant/lead-capture`.

Campos aceitos:

- obrigatórios: `name` e pelo menos um entre `phone` e `email`;
- opcionais: `company`, `source` (`site` ou `formulario`), `campaign` e `page`.

O endpoint atualiza um lead existente pelo telefone ou e-mail e cria um novo lead quando não há correspondência. A origem é registrada como automática e cada captura entra no histórico de origem.

Exemplo:

```http
POST /api/public/leads
Content-Type: application/json
X-Capture-Token: TOKEN_DO_CLIENTE

{
  "name": "Maria Silva",
  "phone": "+5511999999999",
  "email": "maria@exemplo.com",
  "source": "formulario",
  "campaign": "campanha-julho",
  "page": "/contato"
}
```

## Instagram e Meta - evolução futura

Ainda não estão ativos fluxos de Instagram Direct, comentários, anúncios ou formulários instantâneos. A base de leads já separa origem manual de automática e armazena campanha, página e data de captura, permitindo que futuros webhooks usem o mesmo processo de deduplicação e histórico.

Escopo futuro previsto:

- validar assinatura e idempotência dos webhooks da Meta;
- mapear Instagram Direct e comentários para conversas;
- mapear anúncios e formulários instantâneos para captura automática;
- registrar identificadores externos para impedir eventos duplicados;
- exibir cada canal como disponível somente depois da conexão válida do cliente.
