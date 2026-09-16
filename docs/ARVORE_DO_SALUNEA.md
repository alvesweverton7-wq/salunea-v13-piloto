# ÁRVORE DO SALÚNEA — Documento Vivo

**Versão:** 2.2 — ciclo de recuperação e receita pós-B4  
**Data:** 2026-09-16  
**Status:** B4 aprovado pelo usuário; documentação sincronizada; merge sujeito ao gate de promoção  
**Autoridade:** este documento registra a arquitetura e o fluxo aprovados do Salúnea. Mudanças técnicas aprovadas devem ser refletidas aqui antes de um bloco ser considerado concluído.

## 1. Restrições invariantes

- Custo de produção e piloto: **R$ 0**. Usar somente free tiers, open-source ou recursos sem ônus.
- Preservar arquitetura multi-tenant e fluxos aprovados; empresa/tenant é a fronteira lógica de isolamento.
- RLS e autorização no banco; nenhuma confiança em filtro apenas de frontend.
- Não criar rota arquitetural paralela sem validação humana.
- Mudanças em branch isolada, com testes e aprovação antes de promoção.
- `main` não recebe mudança arquitetural sem gate humano explícito.

## 2. Baseline técnico oficial

A release candidata C12 do repositório `salunea-v13-piloto` permanece o baseline executável. O ZIP histórico permanece referência visual/histórica.

Componentes: autenticação Supabase; empresa/unidade; Dashboard; Agenda; Clientes; Atendimento/Comanda; Caixa; Estoque/Radar; Relatórios; Configurações; PWA/Service Worker; pagamentos líquidos após estornos. B3 adiciona recorrência/Radar de cliente; B4 adiciona ação e atribuição auditável de retorno/receita no backend dev.

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
│   │   └── `revenue_risk`
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
→ atendimento concluído → visita comercial → histórico → recorrência
→ Radar de risco → ação de recuperação → contato → retorno elegível
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

### 6.1 Ação
`client_recovery_actions` registra empresa, unidade, cliente, sinal Radar, canal, status, timestamps, responsável, atendimento/order atribuídos e `recovered_revenue`.

Authenticated possui leitura direta conforme `radar.read`; mutações ocorrem por RPC controlada. Criação exige `radar.manage` e `clients.read`; IDs são validados dentro da empresa.

### 6.2 Consentimento
Canal `whatsapp` exige `whatsapp_opt_in=true` e ausência de revogação. O MVP não depende de API paga de mensageria; contato pode ser operacional/manual.

### 6.3 Conversão
Uma ação contatada somente converte quando existe atendimento `completed` posterior ao contato, do mesmo cliente/empresa, com `order` fechado e dentro da janela de atribuição.

`converted` significa retorno elegível associado à ação segundo regra operacional; não constitui prova científica de causalidade.

### 6.4 Receita recuperada
`recovered_revenue` = pagamentos alocados ao order atribuído menos estornos, com piso zero. Retorno 100% estornado pode permanecer `converted` com receita R$0.

`impact_amount` do Radar continua sendo oportunidade estimada e nunca deve ser apresentado como receita recuperada.

### 6.5 Janela dinâmica
A atribuição usa o ciclo individual robusto do B3 mais a tolerância `late` da política de recorrência. `recovery_attribution_days`, quando explicitamente configurado, funciona como teto máximo.

Sem ciclo suficiente e sem política explícita, a atribuição automática falha de forma fechada e não inventa prazo global.

Com defaults atuais de piloto, exemplos teóricos: ciclo 15 → ~23 dias; 30 → 45; 45 → ~68; 60 → 90. São parâmetros de piloto, não regra universal do setor.

### 6.6 Idempotência e anti-dupla-contagem
Índices únicos impedem o mesmo attendance/order de ser atribuído a ações diferentes. Reprocessar a mesma ação mantém a mesma conversão/valor. Teste verdadeiramente simultâneo em sessões independentes permanece desejável antes de produção.

## 7. Isolamento e ambientes — custo zero

Durante desenvolvimento/piloto não criar infraestrutura paga para isolamento. Estratégia: isolamento lógico por empresa, RLS, permissões no banco, testes reversíveis, branches Git e ausência de segredos privados no frontend/repositório. Separação física só após piloto e autorização explícita de custo.

## 8. Fluxo de desenvolvimento

```text
ÁRVORE/requisito → branch isolada → implementação → validação estática
→ testes funcionais/segurança → relatório → VALIDAÇÃO HUMANA
→ atualização da ÁRVORE/evolução → merge/promoção autorizada → próximo bloco
```

## 9. Sequência pós-C12

1. Sincronizar Árvore/baseline C12. **Concluído.**
2. Fechar gates C12 sem custo. **Em evolução contínua.**
3. Nome + Telefone. **Base auditada; canonicalização BR permanece hardening separado.**
4. Motor de Recorrência. **B3 concluído e promovido.**
5. Radar → ação → retorno → receita recuperada. **B4 aprovado; backend dev validado; documentação sincronizada; aguardando promoção.**
6. Orquestração automática Radar/recuperação sem custo + E2E/hardening.
7. UI/indicadores de recuperação e validação visual desktop/mobile.
8. Base44 somente com ganho comprovado sem substituir baseline.
9. Refinar assets visuais sem alterar arquitetura funcional.
10. Automatizar provisionamento somente com solução custo zero.
11. Piloto 3–10 empresas.
12. Materiais comerciais após evidência do piloto.

## 10. Definição de pronto

Bloco somente é concluído com implementação/configuração; testes/evidências; custo adicional R$0; ausência de divergência não autorizada; validação humana; Árvore e evolução sincronizadas; próximo gate identificado.

## 11. Registro de Evolução

| Data | Bloco | Alteração | Módulos/arquivos | Impacto | Evidência/Teste | Status | Próximo gate |
|---|---|---|---|---|---|---|---|
| 2026-09-16 | B1 | Auditoria Árvore × ZIP × GitHub | documentação/C12 | C12 baseline | auditoria/release | validado | B2 |
| 2026-09-16 | B2 | Sincronização arquitetural | `docs/ARVORE_DO_SALUNEA.md` | documento vivo/custo zero | branch + validação | concluído | B3 |
| 2026-09-16 | B3 | Recorrência + financeiro líquido + Radar | migrations B3B–B3H | histórico → ciclo → risco | relatório B3/regressões | concluído/merge main | B4 |
| 2026-09-16 | B4 | Ação de recuperação + retorno atribuível + receita líquida + janela dinâmica | migrations B4A/B4C/B4E; `client_recovery_actions`; RPCs | fecha Radar → ação → retorno → receita recuperada sem mensageria paga obrigatória | `docs/RELATORIO_VALIDACAO_B4_RECUPERACAO_2026-09-16.md`; cross-tenant; consentimento; estorno; idempotência; anti-dupla-contagem; janela dinâmica | aprovado pelo usuário / documentação sincronizada | abrir PR e gate de promoção |

## 12. Pendências deliberadas pós-B4

- Calibrar thresholds/janela com evidência real do piloto.
- Canonicalizar telefone brasileiro (+55/DDD/variações).
- Avaliar recorrência específica por serviço após evidência.
- Orquestrar ciclo geral Radar + recuperação sem custo recorrente obrigatório.
- Implementar UI de ação, conversão e receita recuperada.
- Executar concorrência simultânea multi-sessão antes de produção.
- Normalizar convenção/versionamento das migrations entre GitHub e histórico Supabase antes da promoção final.

## 13. Regra de manutenção documental

Toda alteração aprovada registra o que mudou, módulos/arquivos, motivo, impacto, dependências, evidência, status e próximo gate. Código e Árvore não evoluem de forma independente.
