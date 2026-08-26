# CRM Flow - Platform Rules

## 1. Objetivo

Definir regras transversais que não podem ser tratadas apenas como detalhe de tela.

## 2. Multitenancy

Todo dado de negócio deve pertencer a um tenant identificável.

Regras:

- usuário comum e administrador operam apenas no tenant autorizado;
- Master pode alternar tenant apenas quando a função administrativa permitir;
- frontend não deve assumir que filtro visual substitui isolamento real;
- backend deve validar tenant em toda operação sensível;
- consultas, criação, atualização e exclusão devem respeitar tenant.

## 3. Perfis e permissões

Perfis atuais conhecidos:

- master;
- admin;
- user.

Apresentação recomendada:

- Master Consult Services;
- Administrador;
- Atendente.

Perfil Gestor fica previsto para evolução.

### Regra central

A aplicação deve evoluir de checks espalhados como `role === admin` para uma política central de autorização.

Modelo desejado:

- role;
- permission;
- feature;
- tenant.

Exemplos de permissões futuras:

- `lead.read`;
- `lead.create`;
- `lead.update`;
- `lead.assign`;
- `pipeline.manage`;
- `chat.read`;
- `chat.reply`;
- `settings.brand.manage`;
- `settings.ai.manage`;
- `settings.whatsapp.manage`.

## 4. Segurança de rota

Rotas privadas devem validar sessão e permissão.

Esconder menu ou botão não é autorização suficiente.

## 5. Whitelabel

Whitelabel pertence ao tenant e deve seguir o mesmo contrato visual adotado no 7Commander.

### 5.1 Identidade permanente do produto

O CRM Flow continua sendo uma plataforma Consult Services mesmo quando um cliente aplica sua marca.

A personalização do tenant não pode apagar:

- nome `CRM Flow`;
- descrição funcional do produto;
- atribuição `Consult Services Tecnologia`.

### 5.2 Identidade do cliente

O tenant pode configurar oficialmente:

- nome exibido;
- logo do cliente;
- cor principal;
- cor de destaque.

Ao selecionar uma logo, a aplicação deve sugerir automaticamente uma paleta com cor principal e cor de destaque, permitindo ajuste manual antes de salvar.

### 5.3 Aplicação visual

- logo do cliente aparece em zona neutra/branca no topo da sidebar;
- cor principal controla a área de navegação e ações primárias;
- cor de destaque controla seleção/ênfase visual;
- contraste de texto deve ser calculado de forma segura;
- estados semânticos de sucesso, alerta e erro não seguem whitelabel;
- mobile e desktop usam a mesma identidade.

### 5.4 Persistência

Em `main` e `develop`, identidade é persistida no backend por tenant e deve sobreviver a logout, login e reload.

Em `demo/localstorage`, identidade é persistida apenas no navegador e deve sobreviver a reload até `Restaurar dados iniciais`.

### 5.5 Restaurar Consult Services

A tela de identidade deve possuir ação explícita `Restaurar Consult Services`, retornando nome, logo e cores para os padrões institucionais.

### 5.6 Compatibilidade técnica atual

O campo legado `sidebar_color` do backend é utilizado temporariamente como armazenamento da `cor de destaque`. A sidebar deriva sua cor da `primary_color`. Esta compatibilidade evita migração destrutiva agora e deve ser eliminada em futura normalização de schema.

Não permitir CSS arbitrário por tenant. Preferir tokens controlados.

## 6. Auditoria

Eventos sensíveis devem ser preparados para auditoria, especialmente:

- login e logout relevantes;
- alteração de configuração;
- alteração de integração;
- mudança de responsável;
- movimentação de etapa;
- ganho/perda de oportunidade;
- alteração de perfil/permissão;
- ações Master sobre tenant.

Registro recomendado:

- actor_user_id;
- tenant_id;
- action;
- entity_type;
- entity_id;
- before quando aplicável;
- after quando aplicável;
- created_at.

## 7. Dados sensíveis

- tokens e segredos de integração nunca devem ser enviados desnecessariamente ao frontend;
- logs não devem registrar segredos;
- valores secretos devem aparecer mascarados;
- respostas de erro não devem expor stack trace ao usuário final.

## 8. Estado global

Zustand pode ser mantido nesta fase.

Regras:

- não armazenar estado local de UI globalmente sem necessidade;
- separar dados de domínio de preferências visuais;
- não usar store como substituto indiscriminado de camada de serviço;
- mutações críticas devem tratar sucesso e erro explicitamente.

## 9. APIs

Toda chamada deve prever:

- loading;
- erro;
- retry quando aplicável;
- validação de payload;
- feedback ao usuário.

Evitar componentes com lógica HTTP duplicada quando um service compartilhado resolver o caso.

## 10. Ambientes

O contrato de `main`, `develop` e `demo/localstorage` é obrigatório e está documentado em `ENVIRONMENTS.md`.

## 11. Compatibilidade com Consult Services

O CRM Flow deve ser preparado para futura integração com identidade/licenciamento central da Consult Services, sem implementar essa mudança de forma improvisada nesta fase.

Evitar novas decisões que dificultem:

- SSO futuro;
- licenciamento por produto;
- permissões centralizadas;
- acesso via Consult Hub.
