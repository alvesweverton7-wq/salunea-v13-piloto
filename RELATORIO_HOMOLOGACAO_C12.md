# Relatório de homologação C12 — Salúnea

Data: 15/09/2026 (BRT)  
Base auditada: `salunea-p3-preview` / `59e31dc5401c9f3c7cd4048548e9844a1133e178`

## Veredito executivo

**Status atual: RC técnica pronta para homologação autenticada; ainda não é GO de piloto.**

Não há defeito P0 conhecido no código consolidado. O P1 financeiro identificado foi corrigido no frontend e em migration, e passou em prova transacional real com rollback. O GO permanece condicionado a três gates: aplicar a migration no ambiente escolhido, executar o navegador autenticado com cinco contas de teste e aprovar a comparação visual humana em desktop/mobile.

## Alterações concluídas

| Área | Resultado |
|---|---|
| Fonte verdadeira | ZIP íntegro e vinculado ao commit de origem |
| Financeiro | saldo e fechamento usam pagamentos líquidos de estornos |
| Dependência | Supabase JS fixado em `2.116.0` |
| PWA | cache, asset list e registro do SW unificados |
| Protótipo inseguro | removido do artefato publicável |
| Atendimento/Comanda | tela real adicionada, sem dados hardcoded |
| Relatórios | métricas por tenant/unidade e recebido líquido |
| Configurações | empresa, unidade, profissionais e serviços reais |
| Navegação | sidebar desktop com os módulos consolidados |

## Evidências executadas

### Validação estática

- JavaScript principal: sintaxe válida.
- `c12-modules.js`, `visual-wave1.js`, `prepilot-radar-stock.js`, `sw.js`: sintaxe válida.
- HTML: parse válido, 72 IDs, zero IDs duplicados.
- `git diff --check`: sem whitespace errors.
- placeholders Supabase e dados fictícios do protótipo: ausentes do artefato publicável.

### P1 financeiro — teste real e reversível

Fluxo executado via usuário/RPC/comanda reais:

1. pagamento parcial de R$ 10,00;
2. estorno integral de R$ 10,00;
3. novo pagamento de R$ 10,00;
4. cálculo líquido após o ciclo.

Resultado:

| Prova | Resultado |
|---|---|
| novo pagamento após estorno integral | PASS |
| pagamentos distintos criados na transação | 2 |
| saldo líquido final | R$ 10,00 |
| persistência dos dados de ensaio | nenhuma; ROLLBACK |

### Isolamento multitenant — cinco empresas concorrentes

Cinco identidades reais foram consultadas em paralelo sob a role `authenticated`. Para cada uma, foram verificados: empresas, clientes, agendamentos, comandas, pagamentos, produtos, unidades, serviços e profissionais.

| Tenant | própria empresa visível | outras empresas visíveis | vazamentos nos 8 domínios |
|---|---:|---:|---:|
| 1 | 1 | 0 | 0 |
| 2 | 1 | 0 | 0 |
| 3 | 1 | 0 | 0 |
| 4 | 1 | 0 | 0 |
| 5 | 1 | 0 | 0 |

Prova de escrita:

- INSERT direto em `clients`: bloqueado pela política;
- `create_client` via RPC no tenant próprio: permitido;
- `create_client` via RPC em tenant alheio: negado;
- todas as operações de ensaio: revertidas.

## Gaps que impedem declarar GO

| Gate | Motivo | Severidade operacional |
|---|---|---|
| Migration aplicada | a correção foi validada em transação, mas não aplicada à base principal para evitar mudança irreversível sem gate final | bloqueio de promoção |
| E2E autenticado no navegador | faltam credenciais das cinco contas de teste; o download do Chromium local também falhou no CDN externo | bloqueio de GO |
| Paridade visual humana | o código aproxima a arquitetura conceitual, mas “100% pixel perfect” exige inspeção renderizada desktop/mobile | bloqueio de aceite visual |

## Riscos conhecidos não bloqueantes para esta RC

- funções `SECURITY DEFINER` autenticadas aparecem como alertas do advisor; elas têm `search_path` explícito e verificações de permissão, mas devem continuar sob revisão;
- proteção contra senhas vazadas está desabilitada no Auth e deve ser ativada antes de escala pública;
- CSP ainda aceita scripts e estilos inline por herança da aplicação monolítica; refatorar para arquivos externos reduz superfície de ataque;
- índices marcados como não usados não devem ser removidos antes de tráfego representativo do piloto.

## Prontidão estimada

- núcleo funcional e segurança lógica: **92%**;
- cobertura visual dos módulos: **85%**;
- homologação final comprovada: **70%**;
- prontidão global para iniciar Gate final: **88%**.

Esses números não significam probabilidade de ausência de bugs. Representam cobertura verificável dos critérios definidos. O salto para GO depende dos três gates acima, não de mais prototipação.

## Critério final de GO

GO somente quando, na mesma release:

1. migration aplicada e advisor reexecutado;
2. cinco logins de teste completarem os fluxos Agenda → Atendimento → Comanda → Pagamento → Estorno, sem cruzamento de tenant;
3. duplo clique/idempotência e interrupção de rede passarem;
4. desktop e mobile forem aprovados visualmente;
5. zero P0/P1 permanecer aberto.
