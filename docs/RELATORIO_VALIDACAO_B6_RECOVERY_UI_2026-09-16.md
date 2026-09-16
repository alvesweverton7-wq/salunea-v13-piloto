# RELATÓRIO DE VALIDAÇÃO B6 — RECOVERY UI

**Data:** 2026-09-16  
**Ambiente:** desenvolvimento / preview  
**Branch:** `feat/b6-recovery-ui`  
**Status:** validação técnica parcial concluída; inspeção visual autenticada humana ainda pendente

## 1. Objetivo

Expor na interface o diferencial já validado no backend B3–B5 sem criar arquitetura paralela: Radar de cliente → ação de recuperação → contato → retorno atribuído → receita recuperada líquida.

## 2. Implementação B6A

Arquivo alterado: `prepilot-radar-stock.js`.

- atualização manual do Radar passou do detector legado `detect_radar_signals` para o orquestrador B5 `run_radar_cycle`, cobrindo Radar geral + recuperação;
- sinais de origem `client` passam a carregar contexto do cliente e ações de recuperação existentes;
- UI diferencia explicitamente:
  - **Oportunidade estimada**: `radar_signals.impact_amount`, sem promessa de receita;
  - **Retorno atribuído**: ação em status `converted`;
  - **Receita recuperada líquida**: `client_recovery_actions.recovered_revenue`;
- ação pode ser criada por telefone, WhatsApp, presencial ou outro canal;
- WhatsApp é oferecido somente quando o cliente possui opt-in ativo e não revogado;
- ação planejada pode ser marcada como contatada;
- ação contatada pode solicitar verificação de retorno/conversão via RPC;
- Estoque permanece preservado no mesmo módulo.

## 3. Contrato backend revalidado

No Supabase dev foram revalidados os RPCs:

- `public.run_radar_cycle`;
- `public.create_client_recovery_action`;
- `public.mark_client_recovery_contacted`;
- `public.refresh_client_recovery_conversion`.

Os wrappers públicos permanecem `SECURITY INVOKER`. As funções `app` que executam mutações permanecem protegidas por autorização server-side.

`client_recovery_actions` mantém `authenticated` com `SELECT` direto apenas. Escritas não foram abertas diretamente à UI; passam pelos RPCs.

A política RLS de leitura permanece vinculada a `app.has_permission('radar.read', company_id, unit_id)`.

Não foi identificada permissão `anon`/`PUBLIC` nos RPCs públicos usados pela UI.

## 4. Estados funcionais representados

A UI foi estruturada para os estados já suportados pelo contrato B4/B5:

1. **Sem ação** — sinal de cliente apresenta oportunidade e permite iniciar recuperação.
2. **Ação planejada** — mostra canal e permite registrar contato.
3. **Contato registrado** — permite verificar retorno elegível.
4. **Convertido com receita positiva** — exibe retorno atribuído e receita líquida em BRL.
5. **Convertido com receita R$ 0** — continua sendo retorno atribuído, mas não fabrica receita; cenário compatível com estorno integral já validado no B4.

A interface não apresenta `impact_amount` como receita realizada e não afirma causalidade científica entre ação e retorno.

## 5. On-demand refresh e passagem do tempo

B6 fecha a limitação registrada no B5 para uso interativo: ao acionar **Atualizar sinais**, a interface chama `run_radar_cycle`, permitindo recalcular sinais de recorrência mesmo quando não houve novo atendimento naquele instante.

Isso complementa o gatilho event-driven de conclusão de atendimento. Não equivale a um job diário automático: se ninguém abrir/atualizar o Radar, a passagem do tempo por si só não dispara o cálculo.

## 6. Preview

Commit B6A: `70eb5f9f70a585506f1fef8b84a8428c17ca728e`.

O status Vercel do commit concluiu com `success` / `Deployment has completed`.

## 7. Resultado técnico atual

- nenhuma regressão de autorização identificada na revalidação;
- nenhuma mudança de banco necessária para a UI B6A;
- nenhuma dependência paga adicionada;
- nenhuma mudança em produção;
- nenhuma mudança em `main`;
- sem P0 identificado neste lote;
- sem P1 bloqueante identificado na validação técnica executável disponível.

## 8. Limitação / gate humano

A validação visual autenticada real em navegador — desktop e mobile — não foi simulada como concluída. É necessária inspeção humana do preview autenticado para validar layout, legibilidade, responsividade, estados visuais e experiência operacional com uma sessão real.

Antes desse gate, o bloco B6 não deve ser promovido a `main` como visualmente aprovado.

## 9. Próximo gate

1. inspeção visual autenticada desktop/mobile;
2. corrigir regressões encontradas, se houver;
3. aprovação humana B6;
4. sincronizar ÁRVORE DO SALÚNEA;
5. abrir PR;
6. merge em gate separado;
7. produção continua não autorizada.
