# Frontend React — convergência Salúnea

Esta pasta nasce do `main` funcional e usa o ZIP React/Vite apenas como referência de apresentação.

Fontes canônicas:
- ÁRVORE DO SALÚNEA: arquitetura e regras.
- `main` + Supabase: contratos funcionais, RLS e RPCs.
- ZIP React/Vite: shell, composição visual e UX.

Regras de migração:
1. Não copiar mocks do ZIP para fluxos reais.
2. Não reimplementar no browser regras já existentes em RPC/RLS.
3. Preservar `company_id`/`unit_id` e autorização server-side.
4. Migrar módulo a módulo com estados loading/empty/error/success.
5. C12 permanece intacto até E2E e aprovação humana.

Ordem: Auth/Tenant → Dashboard → Agenda → Clientes → Atendimento → Caixa → Estoque → Radar/Recuperação → Configurações.
