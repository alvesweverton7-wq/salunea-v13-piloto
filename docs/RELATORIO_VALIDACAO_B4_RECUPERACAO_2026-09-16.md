# Relatório de Validação B4 — Recuperação e Receita

Data: 2026-09-16
Ambiente: Supabase dev `salao-saas-v1-dev`
Branch: `feat/b4-client-recovery-loop`
Status: tecnicamente validado no ambiente dev; aguardando aprovação humana para sincronização da ÁRVORE e promoção.

## Escopo
B4 fecha o ciclo Radar → ação → contato → retorno → receita líquida atribuída, sem mensageria paga obrigatória.

## Componentes
- `client_recovery_actions`: trilha auditável de ação.
- RPC de criação: valida empresa/cliente/unidade/sinal e permissões.
- WhatsApp: exige consentimento ativo.
- RPC de contato: timestamp idempotente.
- RPC de conversão: busca primeiro atendimento concluído elegível e order fechado.
- Receita: pagamentos alocados menos estornos, piso zero.
- Índices únicos impedem atribuição do mesmo attendance/order a ações distintas.
- Janela dinâmica usa ciclo individual robusto do B3 + tolerância `late`; teto explícito da empresa é opcional.
- Sem histórico suficiente e sem política explícita: atribuição automática permanece desligada.

## Testes executados
1. Ação própria criada e marcada `contacted` em transação reversível.
2. WhatsApp sem opt-in: bloqueado.
3. Cross-tenant: bloqueado.
4. Retorno posterior + order fechado + R$80 líquidos: `converted`, receita recuperada R$80.
5. Retorno integralmente estornado: cliente convertido, receita recuperada R$0.
6. Duas ações concorrendo pelo mesmo retorno em sequência: primeira captura; segunda permanece `contacted` com R$0.
7. Mesma ação reprocessada: permanece no mesmo order e R$80; sem duplicação.
8. Política sem janela e perfil sem ciclo: fail-closed, sem atribuição.
9. Ciclo sintético de 30 dias: deadline dinâmico de 45 dias com parâmetros atuais.
10. Radar com `unit_id NULL`: schema possui índice único `NULLS NOT DISTINCT`; detector executado duas vezes em rollback sem duplicatas observadas.
11. `client_recovery_actions`: authenticated possui somente SELECT direto; escrita ocorre via RPC.

## Interpretação de métricas
- `impact_amount` do Radar = oportunidade estimada, não receita garantida.
- `converted` = retorno elegível associado à ação segundo regra de atribuição.
- `recovered_revenue` = receita líquida do order atribuído após pagamentos e estornos.
- Atribuição é uma regra operacional do Salúnea; não prova causalidade científica da ação sobre o retorno.

## Segurança
RLS ativa. Leitura requer `radar.read`. Mutação requer `radar.manage`; criação também exige `clients.read`. IDs de empresa/unidade/cliente/sinal são validados no servidor. Escrita direta de authenticated permanece revogada.

## Resultado
Nenhum P0 identificado nos testes B4 executados. Nenhum P1 bloqueante identificado no fluxo testado.

## Pendências deliberadas / próximos blocos
- Calibrar parâmetros de recorrência/atribuição com dados reais do piloto.
- UI de ação/resultado e indicadores de recuperação.
- Orquestração do ciclo geral Radar + Radar de recuperação sem custo recorrente obrigatório.
- Automação de mensageria somente se houver opção compatível com consentimento, LGPD e custo zero; MVP não depende dela.
- Teste de concorrência verdadeiramente simultânea em sessões distintas permanece desejável antes de produção; índices únicos fornecem proteção estrutural contra dupla atribuição.

## Gate
B4 pode seguir para aprovação humana. Após aprovação: atualizar `docs/ARVORE_DO_SALUNEA.md`, registrar evolução/impactos, abrir PR e somente então considerar merge mediante autorização explícita.
