# Epic 06 - Compatibilidade, qualidade e entrega

## US-038 - Migrar conexoes manuais existentes
Como time de suporte, quero migrar as conexoes manuais atuais para o novo modelo sem perder dados, para nao quebrar os tenants ja cadastrados.

Critérios de aceite:
- conexoes antigas sao preservadas;
- campos legados recebem tratamento de migracao;
- o sistema nao assume que todo registro antigo e operacional;
- a transicao nao apaga historico.

## US-039 - Manter compatibilidade com endpoints antigos
Como time de plataforma, quero que os endpoints antigos continuem funcionais durante a transicao, para nao interromper o MVP enquanto a nova integracao entra.

Critérios de aceite:
- as rotas atuais continuam existindo enquanto a migracao nao terminar;
- o novo fluxo pode ser introduzido sem quebrar a API existente;
- desconexao antiga passa a mapear para a logica nova;
- a compatibilidade e documentada.

## US-040 - Entregar testes automatizados e roteiro manual
Como time de qualidade, quero testes automaticos e roteiro manual, para garantir que a integracao fique apresentavel e segura.

Critérios de aceite:
- existem testes unitarios e de integracao para fluxos criticos;
- existem cenarios cobrindo onboarding, webhook, envio, status e desconexao;
- existe roteiro manual de validacao;
- os testes sustentam os criterios de aceite da especificacao.

## US-041 - Entregar documentacao operacional e evidencias
Como time de implantacao, quero documentacao de configuracao, deploy e suporte, para operar a integracao sem depender de conhecimento tacito.

Critérios de aceite:
- existe documentacao das variaveis de ambiente;
- existe guia de configuracao do aplicativo Meta;
- existe documentacao de deploy e suporte;
- existem evidencias para os criterios de aceite prioritarios.

## US-042 - Melhorar observabilidade e alertas
Como suporte tecnico, quero relatórios e alertas de falha, para identificar rapidamente problemas de integracao.

Critérios de aceite:
- falhas de onboarding, webhook, envio e desautorizacao ficam registradas;
- eventos de diagnostico podem ser usados para suporte;
- o sistema permite identificar a ultima falha e a ultima sincronizacao;
- os logs nao expõem segredos.
