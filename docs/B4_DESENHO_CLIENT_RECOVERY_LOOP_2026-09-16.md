# B4 — Radar → Ação → Retorno → Receita Recuperada

Data: 2026-09-16
Branch: `feat/b4-client-recovery-loop`
Status: desenho técnico inicial; sem alteração de produção/main.

## Objetivo
Fechar o ciclo do diferencial Salúnea sem depender de mensageria paga: transformar um sinal `revenue_risk` em ação rastreável, vincular um retorno real posterior e medir receita líquida efetivamente recuperada.

## Descoberta no schema atual
- `radar_signals` já representa oportunidade/risco, mas não registra ação executada nem atribuição de retorno.
- `clients` já possui `whatsapp_opt_in`, `whatsapp_consent_at`, fonte/versão de consentimento e revogação.
- `attendances` e `orders` permitem comprovar atendimento concluído e receita.
- Não existe hoje tabela específica de campanha/recuperação/mensagem que feche essa cadeia.

## Contrato proposto
1. Radar detecta cliente em `attention`, `at_risk` ou `late`.
2. Usuário abre a oportunidade e registra uma ação de recuperação.
3. A ação pode ser manual no MVP (telefone, WhatsApp aberto pelo operador, outro canal), evitando custo de API.
4. Consentimento de WhatsApp continua obrigatório quando o canal exigir.
5. Ação registra `company_id`, `client_id`, `radar_signal_id`, `unit_id`, canal, status, responsável e timestamps.
6. Um atendimento `completed` posterior à ação pode ser candidato a retorno recuperado.
7. Receita recuperada só é reconhecida a partir de pagamentos líquidos vinculados ao atendimento/order posterior; nunca do `impact_amount` estimado do Radar.
8. Estornos reduzem a receita recuperada.
9. Atribuição precisa ser determinística e auditável; estimativa do Radar e receita efetivamente recuperada são métricas distintas.
10. Toda leitura/escrita permanece isolada por empresa e protegida por permissões/RLS.

## Modelo mínimo sugerido
`client_recovery_actions`: ação humana/rastreável.

Campos previstos: id, company_id, unit_id, client_id, radar_signal_id, channel, status (`planned|contacted|responded|converted|dismissed`), contacted_at, converted_at, recovered_attendance_id, recovered_order_id, recovered_revenue, created_by, created_at, updated_at.

## Regra de atribuição candidata ao teste
Para o piloto, uma conversão somente poderá existir quando houver atendimento concluído do mesmo cliente/empresa após `contacted_at`. O valor reconhecido será receita líquida efetivamente alocada ao order desse atendimento, menos estornos.

A janela máxima de atribuição ainda NÃO está aprovada. Não será inventada silenciosamente; deve ser parametrizada/validada antes de congelar a regra.

## Próximo gate técnico
Validar permissões existentes, FKs/índices, estados de orders/payments e desenhar migration B4A com RLS + RPCs. Depois executar cenário reversível: risco → ação → atendimento posterior → pagamento → receita recuperada → estorno, comprovando isolamento entre tenants.
