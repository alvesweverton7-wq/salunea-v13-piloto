# Contratos de dados — convergência React

## Auth/Tenant
- Supabase Auth continua canônico.
- Contexto ativo deve resolver empresa e unidade autorizadas antes de liberar módulos.
- UI não contorna RLS e não usa tenant global.

## Clientes
- Identidade comercial: nome + telefone dentro da empresa.
- Criação deve consumir o RPC `create_client` existente; não duplicar normalização/uniqueness no browser.

## Agenda
- Fonte: `appointments`, sempre limitada ao contexto autorizado e ao fuso da unidade.
- Status comerciais existentes devem ser preservados.

## Atendimento
- Fonte funcional C12: `attendances`, `clients`, `orders`.
- Conclusão de atendimento permanece o evento que alimenta recorrência/Radar.

## Caixa
- Fonte: `orders`, `payment_records`, `payment_refunds` e RPCs financeiros existentes.
- Receita exibida deve respeitar valor líquido após estornos.

## Estoque
- Fonte: `v_projected_stock`, `unit_products`, `products`.
- Escrita: `record_stock_movement`; manter idempotência e proteção contra saldo inválido.

## Radar/Recuperação
- Fonte: `radar_signals`, `client_recurrence_profiles`, `client_recovery_actions`.
- Orquestração: `run_radar_cycle`.
- Ações: RPCs de criação, contato e atualização de conversão já validados.
- `impact_amount` é oportunidade estimada; receita recuperada é atribuição líquida, não causalidade científica.

## Regra de migração
Cada tela React só substitui a equivalente C12 depois de build/typecheck, teste funcional, E2E tenant/RLS e validação humana.
