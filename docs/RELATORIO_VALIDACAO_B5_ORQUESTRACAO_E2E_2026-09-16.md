# Relatório Consolidado B5 — Orquestração Radar e E2E

Data: 2026-09-16
Ambiente: Supabase dev `salao-saas-v1-dev`
Branch: `feat/b5-radar-orchestration-e2e`
Status: validação técnica concluída; aguardando aprovação humana antes de sincronizar ÁRVORE/PR.

## Objetivo
Fechar o ciclo operacional do diferencial Salúnea sem scheduler ou mensageria paga obrigatória: operação real gera atualização da inteligência, que pode originar ação de recuperação e receita atribuída.

## B5A — ponto único de orquestração
`app/public.run_radar_cycle(company,unit)` executa o detector Radar geral e o detector de recuperação sob o RBAC existente. Cross-tenant é bloqueado. Execuções repetidas não produziram duplicação observada.

## B5B — gatilho event-driven custo zero
`public.complete_attendance_and_open_order` preserva a rotina `app` como autoridade da transição comercial. Após concluir atendimento/abrir order, tenta o ciclo Radar para a própria empresa/unidade somente se a sessão também possui `radar.manage`.

Falha da inteligência é isolada: não desfaz atendimento nem comanda. Assim, o Radar permanece auxiliar à operação principal.

## B5C — E2E reversível
Cenário integrado executado dentro de transação reversível:

agendamento → atendimento → conclusão → Radar → ação de recuperação → contato → retorno elegível → comanda → pagamento → fechamento → conversão → receita recuperada.

Resultado controlado: order de R$80, ação `converted`, `recovered_revenue=R$80`. O teste terminou com rollback deliberado; dados artificiais não persistiram.

## B5D — observabilidade
O ciclo Radar passa a registrar execução em `audit_logs`, estrutura append-only já existente, sem nova infraestrutura externa. Evento de sucesso: `radar.cycle.completed`; falhas do ciclo tentam registrar `radar.cycle.failed` antes de propagar o erro.

Teste reversível de sucesso registrou: general=1, recovery=0 e duração=36 ms no cenário observado. O valor é evidência daquele teste, não SLA.

ACL das rotinas `app/public.run_radar_cycle`: authenticated, service_role e postgres; sem PUBLIC/anon.

## Segurança e isolamento
- `radar.manage` obrigatório para executar ciclo.
- `clients.read` continua obrigatório dentro do detector de recuperação.
- fronteira company/unit preservada.
- tentativa cross-tenant previamente bloqueada.
- wrapper de conclusão não concede Radar a usuário sem `radar.manage`.
- `audit_logs` permanece append-only para authenticated; UPDATE/DELETE bloqueados por trigger e escrita direta não é concedida pelo ACL atual.

## Custo
A arquitetura B5 não exige cron externo, Make, API paga de WhatsApp ou nova instância. O gatilho é event-driven no próprio fluxo já executado pelo banco. Portanto não adiciona dependência externa recorrente ao núcleo.

## Resultado
Nenhum P0 identificado. Nenhum P1 bloqueante identificado nos testes executados.

## Pendências deliberadas antes de produção
- teste de carga/latência em volume representativo do piloto;
- concorrência simultânea multi-sessão no fluxo de recuperação;
- validação browser E2E com as cinco identidades e UI real;
- observabilidade de falha deve ser exercitada em cenário controlado sem comprometer dados;
- calibrar frequência/custo computacional com dados do piloto; se necessário, adicionar throttling interno sem serviço externo.

## Gate
B5 está pronto para aprovação humana. Após aprovação: sincronizar `docs/ARVORE_DO_SALUNEA.md`, registrar evolução B5 e abrir PR. Merge em main continua sendo gate separado. Produção não está autorizada por este relatório.
