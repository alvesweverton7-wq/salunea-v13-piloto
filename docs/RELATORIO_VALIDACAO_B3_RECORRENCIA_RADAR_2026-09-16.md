# Relatório de Validação B3 — Recorrência e Radar

Data: 2026-09-16
Ambiente: Supabase `salao-saas-v1-dev` (homologação/dev)
Branch: `feat/b3b-client-recurrence-intelligence`
Status: tecnicamente validado para aprovação humana; não promovido para `main`.

## Escopo validado

1. Isolamento multi-tenant: identidade autenticada possui `clients.read` na própria empresa e não possui na empresa estrangeira testada.
2. Perfil derivado: `authenticated` possui somente SELECT em `client_recurrence_profiles`; não há policy de escrita direta.
3. RPCs de recorrência/Radar: execução restrita a `authenticated`, `service_role` e proprietário/postgres; `anon`/PUBLIC removidos.
4. Visita comercial: múltiplos atendimentos concluídos no mesmo dia comercial contam como uma visita.
5. Timezone: dia comercial calculado pelo timezone da unidade, com fallback `America/Sao_Paulo`.
6. Histórico insuficiente: uma visita não gera ciclo artificial nem alerta de churn.
7. Ciclo: mediana dos últimos N intervalos (default 5), reduzindo efeito de outliers. Caso 30/31/29/120/30: média=48, mediana=30.
8. Política: limites externalizados em `recurrence_policies`, por empresa; defaults de piloto são hipóteses calibráveis, não verdade setorial.
9. Estados testados em ciclos 15/30/45/60 dias: normal, attention, at_risk e late conforme parâmetros vigentes.
10. Financeiro: `lifetime_revenue` usa pagamentos alocados menos estornos; `average_ticket` divide receita líquida pelas visitas comerciais.
11. Radar: cenário controlado 3 visitas / ciclo 30 / 40 dias sem retorno / R$240 líquidos gerou `revenue_risk`, status `at_risk`, impacto R$80, confiança high, urgência 4, acionabilidade 5.
12. Reversibilidade: cenário positivo foi executado em transação com rollback; nenhum perfil/sinal artificial persistiu.

## Regressão em dado real

Cliente real testado com três atendimentos no mesmo dia permaneceu como 1 visita comercial, `average_return_days = null`, `recurrence_status = insufficient_history`, receita líquida histórica R$240 e ticket por visita R$240. Isso confirma que a calibração não reintroduziu o bug de múltiplos retornos no mesmo dia.

## Pendências não bloqueantes / produto

- Os defaults 20%/3 dias e 50%/7 dias são parâmetros iniciais do piloto e devem ser recalibrados com dados reais.
- O perfil é company-level; serviço específico e modelos por serviço ficam fora deste MVP.
- A orquestração automática do detector de recuperação com o detector geral do Radar deve ser tratada em bloco posterior; o detector funcional já existe.
- Canonicalização brasileira de telefone (+55/DDD/variações) é um hardening separado do motor de recorrência.

## Gate

B3 está tecnicamente pronto para aprovação humana. Pelo protocolo da ÁRVORE DO SALÚNEA, após aprovação explícita: atualizar a Árvore/evolution log com fluxo e impactos e somente então autorizar merge do PR #4. Nenhum merge em `main` foi realizado por este relatório.
