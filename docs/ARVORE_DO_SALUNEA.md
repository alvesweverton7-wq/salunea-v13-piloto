# ÁRVORE DO SALÚNEA — Documento Vivo

**Versão:** 2.3 — orquestração event-driven e E2E pós-B5  
**Data:** 2026-09-16  
**Status:** B5 aprovado pelo usuário; documentação sincronizada; merge sujeito ao gate de promoção  
**Autoridade:** este documento registra a arquitetura e o fluxo aprovados do Salúnea. Mudanças técnicas aprovadas devem ser refletidas aqui antes de um bloco ser considerado concluído.

## 1. Restrições invariantes

- Custo de produção e piloto: **R$ 0**. Usar somente free tiers, open-source ou recursos sem ônus.
- Preservar arquitetura multi-tenant e fluxos aprovados; empresa/tenant é a fronteira lógica de isolamento.
- RLS e autorização no banco; nenhuma confiança em filtro apenas de frontend.
- Não criar rota arquitetural paralela sem validação humana.
- Mudanças em branch isolada, com testes e aprovação antes de promoção.
- `main` não recebe mudança arquitetural sem gate humano explícito.
- **Ação humana operacional:** sempre que uma etapa exigir que o usuário altere/configure manualmente Supabase ou GitHub, interromper o fluxo automático e avisar explicitamente o usuário com instruções. Não presumir que a ação foi realizada.

## 2. Baseline técnico oficial

A release candidata C12 do repositório `salunea-v13-piloto` permanece o baseline executável. O ZIP histórico permanece referência visual/histórica.

Componentes: autenticação Supabase; empresa/unidade; Dashboard; Agenda; Clientes; Atendimento/Comanda; Caixa; Estoque/Radar; Relatórios; Configurações; PWA/Service Worker; pagamentos líquidos após estornos. B3 adiciona recorrência/Radar de cliente; B4 adiciona ação e atribuição auditável de retorno/receita; B5 adiciona orquestração event-driven, E2E integrado e observabilidade do ciclo Radar no backend dev.

## 3. Árvore funcional

```text
SALÚNEA
├── Autenticação
├── Empresa / Tenant
│   ├── Unidade
│   ├── Usuários
│   └── Permissões
├── Clientes
│   ├── Nome
│   ├── Telefone normalizado
│   ├── Histórico
│   ├── Última visita
│   ├── Ticket líquido por visita comercial
│   ├── Frequência
│   └── Ciclo de retorno
├── Agenda
├── Atendimento / Comanda
├── Serviços
├── Profissionais
├── Caixa
│   ├── Pagamentos
│   ├── Estornos
│   └── Fechamento
├── Estoque
├── Inteligência Salúnea
│   ├── Motor de recorrência
│   │   ├── visita comercial por dia local da unidade
│   │   ├── mediana dos últimos intervalos
│   │   ├── política calibrável por empresa
│   │   └── insufficient_history / normal / attention / at_risk / late
│   ├── Radar de risco
│   │   ├── `revenue_risk`
│   │   ├── ciclo unificado geral + recuperação
│   │   └── observabilidade em audit_logs
│   ├── Recuperação de cliente
│   │   ├── oportunidade estimada
│   │   ├── ação rastreável
│   │   ├── canal + consentimento
│   │   ├── contato comprovado
│   │   ├── retorno atribuído
│   │   └── anti-dupla-contagem
│   └── Receita recuperada líquida
├── Relatórios
├── Configurações
└── Administração / Master
```

## 4. Fluxo central do cliente

```text
Nome + Telefone → cliente dentro da empresa → agendamento/atendimento
→ atendimento concluído → comanda aberta → gatilho event-driven do Radar
→ visita comercial → histórico → recorrência → Radar de risco
→ ação de recuperação → contato → retorno elegível
→ atendimento concluído → order fechado → pagamentos - estornos
→ receita recuperada segundo regra de atribuição Salúnea
```

Cancelamento/no-show não contam como visita concluída. Múltiplos atendimentos no mesmo dia comercial contam como uma visita para recorrência, preservando efeitos financeiros válidos.

## 5. Motor de Recorrência — B3

- Visita comercial agrupada pela data local do timezone da unidade.
- Fonte: `attendances.status = completed` com `completed_at` válido.
- Ciclo: mediana dos últimos N intervalos positivos; N default 5, configurável.
- Histórico insuficiente não produz ciclo artificial.
- Defaults de atenção/risco são hipóteses calibráveis do piloto.
- Receita histórica líquida = pagamentos alocados menos estornos.
- `client_recurrence_profiles` é cache derivado; authenticated lê conforme `clients.read`, sem escrita direta.
- Radar `revenue_risk` usa ticket líquido histórico como oportunidade estimada, não como receita garantida.

## 6. Contrato de Recuperação e Receita — B4

`client_recovery_actions` registra empresa, unidade, cliente, sinal Radar, canal, status, timestamps, responsável, atendimento/order atribuídos e `recovered_revenue`. Mutações ocorrem por RPC controlada. WhatsApp exige opt-in válido. Conversão exige atendimento completed posterior ao contato, mesma empresa/cliente, order fechado e janela válida. `converted` é atribuição operacional, não prova causal.

`recovered_revenue` = pagamentos alocados menos estornos, piso zero. `impact_amount` permanece oportunidade estimada. Janela usa ciclo individual robusto + tolerância late, com teto opcional. Índices únicos evitam dupla atribuição do mesmo attendance/order.

## 7. Orquestração e observabilidade — B5

### 7.1 Ciclo unificado
`app/public.run_radar_cycle(company, unit)` é o ponto único para executar o detector Radar geral e o detector de recuperação. A execução exige `radar.manage`; o detector de recuperação mantém `clients.read`. Fronteiras company/unit são preservadas e tentativa cross-tenant foi bloqueada em validação.

### 7.2 Gatilho event-driven
`public.complete_attendance_and_open_order` preserva `app.complete_attendance_and_open_order` como autoridade da operação comercial. Após a conclusão/abertura da comanda, tenta executar o ciclo Radar da mesma empresa/unidade quando a sessão também possui `radar.manage`.

O Radar é auxiliar: falha da inteligência não deve desfazer atendimento/comanda. Não há dependência obrigatória de scheduler externo, Make ou mensageria paga para esse gatilho.

### 7.3 E2E validado
Cenário reversível validou:

```text
agendamento → atendimento → conclusão → Radar → ação de recuperação
→ contato → retorno → comanda → pagamento → fechamento
→ conversão → receita recuperada líquida
```

No cenário controlado, order R$80 resultou em ação `converted` e `recovered_revenue=R$80`; transação foi revertida ao final, sem persistência artificial.

### 7.4 Observabilidade
O ciclo Radar reutiliza `audit_logs` append-only. Eventos previstos: `radar.cycle.completed` e tentativa de `radar.cycle.failed`. O teste de sucesso observado registrou general=1, recovery=0 e 36 ms; esse tempo é evidência do cenário, não SLA.

Rotinas `app/public.run_radar_cycle` permanecem sem execução para anon/PUBLIC.

## 8. Isolamento e ambientes — custo zero

Durante desenvolvimento/piloto não criar infraestrutura paga para isolamento. Estratégia: isolamento lógico por empresa, RLS, permissões no banco, testes reversíveis, branches Git e ausência de segredos privados no frontend/repositório. Separação física só após piloto e autorização explícita de custo.

## 9. Fluxo de desenvolvimento

```text
ÁRVORE/requisito → branch isolada → implementação → validação estática
→ testes funcionais/segurança → relatório → VALIDAÇÃO HUMANA
→ atualização da ÁRVORE/evolução → merge/promoção autorizada → próximo bloco
```

Quando uma etapa exigir ação manual do usuário no Supabase ou GitHub, o processo deve sinalizar **AÇÃO HUMANA NECESSÁRIA**, indicar exatamente o que fazer e aguardar confirmação antes de continuar.

## 10. Sequência pós-C12

1. Sincronizar Árvore/baseline C12. **Concluído.**
2. Fechar gates C12 sem custo. **Em evolução contínua.**
3. Nome + Telefone. **Base auditada; canonicalização BR permanece hardening separado.**
4. Motor de Recorrência. **B3 concluído e promovido.**
5. Radar → ação → retorno → receita recuperada. **B4 concluído e promovido.**
6. Orquestração automática Radar/recuperação sem custo + E2E/hardening. **B5 aprovado; backend dev validado; documentação sincronizada; aguardando promoção.**
7. UI/indicadores de recuperação e validação visual desktop/mobile.
8. Base44 somente com ganho comprovado sem substituir baseline.
9. Refinar assets visuais sem alterar arquitetura funcional.
10. Automatizar provisionamento somente com solução custo zero.
11. Piloto 3–10 empresas.
12. Materiais comerciais após evidência do piloto.

## 11. Definição de pronto

Bloco somente é concluído com implementação/configuração; testes/evidências; custo adicional R$0; ausência de divergência não autorizada; validação humana; Árvore e evolução sincronizadas; próximo gate identificado.

## 12. Registro de Evolução

| Data | Bloco | Alteração | Módulos/arquivos | Impacto | Evidência/Teste | Status | Próximo gate |
|---|---|---|---|---|---|---|---|
| 2026-09-16 | B1 | Auditoria Árvore × ZIP × GitHub | documentação/C12 | C12 baseline | auditoria/release | validado | B2 |
| 2026-09-16 | B2 | Sincronização arquitetural | `docs/ARVORE_DO_SALUNEA.md` | documento vivo/custo zero | branch + validação | concluído | B3 |
| 2026-09-16 | B3 | Recorrência + financeiro líquido + Radar | migrations B3B–B3H | histórico → ciclo → risco | relatório B3/regressões | concluído/merge main | B4 |
| 2026-09-16 | B4 | Ação de recuperação + retorno atribuível + receita líquida + janela dinâmica | migrations B4A/B4C/B4E | Radar → ação → retorno → receita | relatório B4 | concluído/merge main | B5 |
| 2026-09-16 | B5 | Ciclo Radar unificado + gatilho event-driven + E2E + observabilidade | migrations B5A/B5B/B5D; relatório B5C/B5 | operação → inteligência → recuperação → receita | E2E reversível R$80; cross-tenant; idempotência; audit log | aprovado pelo usuário / documentação sincronizada | abrir PR e gate de promoção |

## 13. Pendências deliberadas pós-B5

- Canonicalizar telefone brasileiro (+55/DDD/variações).
- Implementar UI/indicadores de ação, conversão e receita recuperada.
- Browser E2E com cinco identidades e validação visual desktop/mobile.
- Executar concorrência simultânea multi-sessão antes de produção.
- Testar carga/latência em volume representativo do piloto e, se necessário, throttling interno sem serviço externo.
- Exercitar observabilidade de falha em cenário controlado.
- Calibrar thresholds/janela com evidência real do piloto.
- Normalizar convenção/versionamento das migrations antes da promoção final.

## 14. Regra de manutenção documental

Toda alteração aprovada registra o que mudou, módulos/arquivos, motivo, impacto, dependências, evidência, status e próximo gate. Código e Árvore não evoluem de forma independente.
