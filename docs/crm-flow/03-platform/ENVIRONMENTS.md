# CRM Flow - Ambientes e Branches

## 1. Objetivo

Fixar o contrato oficial dos três ambientes do CRM Flow e impedir nova mistura entre produção, desenvolvimento e demonstração.

## 2. Main - Produção

Branch: `main`

Regras obrigatórias:

- usa backend/API real;
- usa banco persistente real;
- autenticação real;
- dados reais do tenant;
- whitelabel persistido por tenant;
- nunca usa seeds mockados como fonte operacional;
- recebe somente entregas validadas em `develop`.

## 3. Develop - Desenvolvimento

Branch: `develop`

Regras obrigatórias:

- mesma arquitetura funcional da produção;
- backend/API real do ambiente de desenvolvimento/preview;
- usada como base para branches `feature/*` e `fix/*`;
- recebe primeiro as mudanças aprovadas;
- não deve depender do store demonstrativo.

Fluxo normal:

`feature/* ou fix/* -> develop -> validação -> main`

## 4. Demo - Demonstração comercial

Branch: `demo/localstorage`

Objetivo: permitir demonstração completa do CRM Flow sem depender de banco de produção ou dados de cliente real.

Regras obrigatórias:

- dados 100% fictícios/mockados;
- estado operacional salvo no `localStorage` quando necessário para a demonstração;
- nenhuma dependência obrigatória de banco de produção;
- nunca compartilhar dados reais com `main`;
- deve acompanhar a mesma UX/UI aprovada em `develop`, adaptando somente a camada de dados;
- deve possuir ação explícita `Restaurar dados iniciais`;
- deve identificar claramente `Modo demonstração`;
- whitelabel da demo é local ao navegador e deve sobreviver a reload até a restauração dos dados;
- login de demonstração deve ser previsível e documentado.

## 5. Regra de sincronização

`main` e `develop` não precisam apontar sempre para o mesmo commit durante uma fase em desenvolvimento. O requisito é:

- `main` = última versão aprovada para produção;
- `develop` = próxima versão integrada e em validação;
- depois da homologação, `main` recebe exatamente a versão aprovada de `develop`.

A branch `demo/localstorage` não deve ser igualada por força à `main` ou `develop`, pois sua camada de dados é deliberadamente diferente. Ela deve receber port controlado das mudanças de UX/UI.

## 6. Critério de aceite de ambiente

Antes de promover uma versão:

- build e typecheck sem erro;
- login válido;
- navegação por perfil;
- whitelabel aplicado após reload;
- isolamento de tenant em produção/desenvolvimento;
- demo funcionando sem dados reais;
- smoke test desktop e mobile;
- domínio Vercel apontando para a branch correta.
