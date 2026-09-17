# Salunea — Governança de Release v0.5.1

## Objetivo

Transformar a v0.5.1 na primeira release em que código, banco, segurança, PWA e publicação sejam tratados como uma única unidade verificável.

## Fonte oficial

- Repositório principal: `alvesweverton7-wq/salunea-v13-piloto`
- Branch de desenvolvimento oficial: `main`
- Branch desta reconciliação: `release/v0.5.1-reconciliation-2026-09-17`
- Banco observado: `salao-saas-v1-dev` (`daehpcxdomjkxwzcyehe`)
- Modelo canônico: `company_id` + `unit_id`
- Tabelas legadas (`tenants`, `profiles`, `clientes`, `profissionais`, `servicos`, `agendamentos`) ficam congeladas para migração/legado e não recebem novas features.

## Gates obrigatórios

1. **Git ↔ DB** — toda migration aplicada deve existir no repositório e toda migration do release deve ter ordem e checksum rastreáveis.
2. **Segurança** — revisar `SECURITY DEFINER`, `search_path`, privilégios `anon/authenticated`, RLS e escopo company/unit antes de promoção.
3. **Aplicação** — validar persistência real, idempotência, conflitos de agenda, pagamentos/estornos, isolamento multi-tenant e tratamento de erro.
4. **PWA** — `service worker` e cache devem carregar uma versão explicitamente vinculada ao release.
5. **E2E** — validar o ciclo Agenda → Atendimento → Caixa → Radar e os fluxos de recuperação antes de qualquer piloto comercial.
6. **Produção** — publicação permanece bloqueada até todos os gates anteriores estarem verdes.

## Regras de mudança

- Nenhuma alteração de schema diretamente no banco sem migration versionada.
- Nenhuma relaxação de RLS para contornar erro de aplicação.
- Nenhuma publicação de ZIP/protótipo como se fosse release operacional.
- Não reescrever o frontend inteiro; a modularização será incremental.
- WhatsApp bidirecional e Care Loop só entram no release operacional após gateway, eventos, autorização e auditoria estarem implementados.

## Estado inicial da v0.5.1

A reconciliação foi aberta a partir do B5 em `main`. O banco já contém migrations posteriores ao B5 que precisam ser incorporadas ao histórico versionado antes de qualquer promoção.
