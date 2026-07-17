# Epic 03 - Mensagens e webhook

## US-022 - Enviar mensagens pela Graph API configuravel
Como atendente, quero enviar mensagens pelo WhatsApp usando a versao configuravel da Graph API, para manter o sistema atualizado sem alteracao de codigo.

Critérios de aceite:
- a versao da API vem de ambiente;
- o envio usa o `phone_number_id` correto;
- a autenticacao usa o token da conexao;
- a chamada fica centralizada no servico de integracao.

## US-023 - Salvar mensagem outbound antes do envio
Como suporte tecnico, quero que a mensagem seja persistida antes de sair para a Meta, para nao perder historico em caso de falha.

Critérios de aceite:
- a mensagem nasce como `pending`;
- o ID externo da Meta e salvo quando existir;
- falha de envio atualiza status e erro;
- a persistencia ocorre antes da tentativa de envio.

## US-024 - Atualizar status de mensagens
Como atendente, quero ver `sent`, `delivered`, `read` e `failed`, para acompanhar o ciclo real da conversa.

Critérios de aceite:
- o webhook atualiza a mensagem correta pelo ID externo;
- datas de status sao persistidas quando disponiveis;
- erro da Meta e vinculado a mensagem correta;
- o frontend recebe dados suficientes para refletir o status.

## US-025 - Normalizar telefone e respeitar janela
Como plataforma, quero normalizar o telefone de entrada e respeitar a janela de atendimento, para obedecer as regras da Meta.

Critérios de aceite:
- telefones sao normalizados antes de salvar ou enviar;
- fora da janela, texto livre e bloqueado;
- templates aprovados podem ser usados fora da janela;
- a regra e aplicada no backend.

## US-026 - Processar eventos completos do webhook
Como plataforma, quero processar todos os eventos do webhook da Meta, para nao perder mensagens ou status quando o payload vier com varios itens.

Critérios de aceite:
- o webhook percorre todas as entradas, mudancas e mensagens;
- varios itens no mesmo payload sao processados individualmente;
- tipos nao suportados nao derrubam o fluxo;
- o roteamento usa `phone_number_id` para achar o tenant.

## US-027 - Tratar midia e tipos nao texto
Como atendente, quero que o sistema trate midia e mensagens nao textuais com seguranca, para nao quebrar o CRM com anexos.

Critérios de aceite:
- imagem, audio, documento e outros tipos recebem tratamento minimo seguro;
- metadados da midia podem ser armazenados;
- payload bruto e sanitizado quando persistido;
- mensagens desconhecidas nao impedem processamento do restante.

## US-028 - Impedir duplicidade de mensagens
Como plataforma, quero bloquear mensagens duplicadas recebidas da Meta, para manter a conversa consistente.

Critérios de aceite:
- existe idempotencia por `external_message_id`;
- evento reenviado pela Meta nao gera nova mensagem;
- o comportamento vale para mensagens recebidas e, quando aplicavel, para status;
- o sistema suporta multi canal sem conflito de ids.
