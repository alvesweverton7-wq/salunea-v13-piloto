# Salúnea — release candidata consolidada

Base: branch `salunea-p3-preview`, commit de origem `59e31dc5401c9f3c7cd4048548e9844a1133e178`.

## Conteúdo consolidado

- autenticação real Supabase;
- seleção de empresa e unidade;
- Dashboard, Agenda, Clientes, Atendimento/Comanda, Caixa, Estoque/Radar, Relatórios e Configurações;
- PWA e Service Worker unificados na versão `c3-caixa-estorno-2026-09-14`;
- Supabase JS fixado em `2.116.0`;
- correção transacional pós-estorno em migration versionada;
- nenhuma credencial secreta embutida (somente a chave pública publishable, apropriada para browser).

## Ordem segura de promoção

1. Revisar o relatório de homologação.
2. Aplicar `supabase/migrations/20260915020000_fix_net_payment_after_refunds.sql` por migration no projeto correto.
3. Executar o Gate E2E autenticado com contas de teste das cinco empresas.
4. Publicar todos os arquivos desta pasta na branch de homologação.
5. Validar visualmente desktop e mobile.
6. Somente então promover para o piloto.

Não publique apenas o `index.html`: `c12-modules.js`, `visual-wave1.js`, `prepilot-radar-stock.js`, `sw.js`, manifest, headers e ícones fazem parte do mesmo artefato.
