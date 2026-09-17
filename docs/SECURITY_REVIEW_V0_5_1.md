# Salunea v0.5.1 — SECURITY DEFINER Review

Data da auditoria: 17/09/2026  
Ambiente observado: `salao-saas-v1-dev` (`daehpcxdomjkxwzcyehe`)  
Escopo: funções `SECURITY DEFINER` em `public` e respectivas implementações em `app`.

## Resultado executivo

**Status: PASS parcial, sem promoção para produção.**

A superfície `anon` foi eliminada para as funções `SECURITY DEFINER` públicas auditadas: nenhuma das 22 funções observadas possui `EXECUTE` para `anon`. Todas possuem `search_path` explícito.

A maioria dos endpoints de escrita canônicos delega autorização para `app.has_permission(...)` usando `company_id`/`unit_id` derivados dos registros afetados ou recebidos como parâmetros. Operações financeiras críticas também usam autenticação explícita e, quando aplicável, idempotência.

Entretanto, a revisão identificou um ponto que exige validação complementar antes do GO: vários wrappers `SECURITY DEFINER` são deliberadamente finos e dependem integralmente da implementação `app.*` para autorização. Isso é aceitável quando a implementação é segura, mas deve permanecer coberto por testes E2E e por revisão contínua de `app.has_permission`.

## Inventário observado

| Grupo | Resultado |
|---|---|
| SECURITY DEFINER em `public` | 22 |
| `anon` com EXECUTE | 0 |
| `authenticated` com EXECUTE | 21 |
| `receive_order_payment(uuid,text,numeric)` | sem EXECUTE para `authenticated` |
| SECURITY DEFINER sem `search_path` explícito | 0 |
| Funções canônicas que verificam `app.has_permission` diretamente | presentes nos endpoints críticos auditados |

## Pontos verificados

### Agenda

`create_appointment` valida `appointments.write`, empresa/unidade, cliente, serviço, profissional e disponibilidade/conflitos antes de inserir.  
`change_pilot_appointment` carrega o agendamento pelo ID e deriva `company_id/unit_id` do próprio registro antes de validar `appointments.write`. Também valida status, horário e conflitos.

### Atendimento

`start_attendance_from_appointment` deriva empresa/unidade do agendamento e valida `attendance.write`.  
`complete_attendance_and_open_order` executa a operação de domínio e só dispara o ciclo Radar quando existe empresa/unidade e o usuário possui `radar.manage`.

### Caixa

`open_cash_session`, `close_cash_session` e `record_cash_movement` exigem usuário autenticado e `finance.write` para a empresa/unidade da sessão. A abertura usa chave de idempotência e lock transacional por unidade/data. Movimentações também exigem chave de idempotência.

### Pagamentos / estorno

`receive_order_payment` deriva o escopo da comanda e exige `payments.write`; a variante com chave de idempotência protege contra duplicidade. A sobrecarga sem chave de idempotência não possui EXECUTE para `authenticated` e permanece fora do caminho operacional recomendado.

`receive_pilot_order_payment` exige autenticação, valida caixa aberto para pagamentos em dinheiro e delega ao caminho de pagamento com idempotência.

`refund_order_payment` exige autenticação, `payments.write`, motivo, idempotência e valida o saldo disponível antes do estorno. Para dinheiro, exige sessão de caixa aberta.

`close_order` deriva o escopo da comanda, exige `orders.write`, exige atendimento concluído quando aplicável e verifica recebimento líquido integral antes do fechamento.

### Clientes / WhatsApp

`create_client` exige sessão autenticada e `clients.write`; normaliza telefone e impede duplicidade de telefone ativo na empresa.

`set_client_whatsapp_consent` exige autenticação, valida cliente + empresa, exige `clients.write` e registra estado, data, origem e versão do consentimento.

### Estoque

`record_stock_movement` exige autenticação e `inventory.write`, valida quantidade e usa idempotência.

### Radar / recorrência

`detect_radar_signals` exige `radar.manage`.  
`detect_client_recovery_signals` exige autenticação, `radar.manage` e `clients.read`.  
`refresh_client_recurrence` exige autenticação, `clients.read` e valida o cliente dentro da empresa antes de recalcular o perfil.

### Catálogo

`create_pilot_catalog_item` e `upsert_pilot_catalog_item` exigem `professionals.write` e `services.write` no escopo empresa/unidade antes de alterar profissionais, serviços e relacionamentos.

## Riscos residuais / próximos gates

1. **Revisar formalmente `app.has_permission`**: é o núcleo de autorização dos endpoints canônicos e precisa de testes negativos para empresa/unidade diferentes.
2. **E2E de autorização**: usuário autenticado da empresa A não pode criar/alterar/pagar/estornar/fechar registros da empresa B ou unidade não autorizada.
3. **E2E de idempotência financeira**: repetição da mesma chave não pode criar segundo pagamento, estorno, abertura ou movimento.
4. **Auditar caminhos legados**: `get_user_tenant_id()` e `is_software_master()` continuam necessários para compatibilidade com a arquitetura legada, mas não devem ser usados para novos módulos canônicos.
5. **Revisar privilégios do restante das funções `SECURITY DEFINER`** antes de introduzir WhatsApp/Care Loop.
6. **Não promover produção** enquanto reconciliação Git↔DB, E2E, PWA/cache e configuração de proteção contra senhas vazadas não estiverem aprovadas.

## Decisão de release

Este documento registra uma **auditoria parcial aprovada**, não uma autorização de produção. A branch `release/v0.5.1-reconciliation-2026-09-17` continua sendo candidata de reconciliação; `main` permanece inalterada.
