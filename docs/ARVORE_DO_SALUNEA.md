# ÁRVORE DO SALÚNEA — Documento Vivo

**Versão:** 2.1 — recorrência e Radar pós-B3  
**Data:** 2026-09-16  
**Status:** B3 aprovado pelo usuário; documentação sincronizada; merge ainda sujeito ao gate de promoção  
**Autoridade:** este documento registra a arquitetura e o fluxo aprovados do Salúnea. Mudanças técnicas aprovadas devem ser refletidas aqui antes de um bloco ser considerado concluído.

## 1. Restrições invariantes

- Custo de produção e piloto: **R$ 0**. Usar somente free tiers, open-source ou recursos sem ônus.
- Preservar a arquitetura multi-tenant e os fluxos aprovados.
- `tenant_id`/empresa é a fronteira lógica de isolamento dos dados.
- Não criar rota arquitetural paralela sem validação humana.
- Mudanças devem ocorrer em bloco isolado, com teste e aprovação antes do próximo bloco.
- A branch `main` não deve receber mudanças de arquitetura sem validação do bloco correspondente.

## 2. Baseline técnico oficial

A release candidata C12 do repositório `salunea-v13-piloto` é o **baseline executável**.

O ZIP histórico permanece como referência visual/histórica e não substitui automaticamente a C12.

Componentes existentes na C12: autenticação Supabase; seleção de empresa/unidade; Dashboard; Agenda; Clientes; Atendimento/Comanda; Caixa; Estoque/Radar; Relatórios; Configurações; PWA/Service Worker; correção financeira de pagamentos líquidos após estornos.

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
│   ├── Agendamento
│   ├── Reagendamento
│   ├── Cancelamento
│   └── No-show
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
│   │   └── estados: insufficient_history / normal / attention / at_risk / late
│   ├── Radar de risco
│   │   └── sinal de recuperação `revenue_risk`
│   ├── Receita em risco
│   ├── Recuperação de cliente
│   └── Receita recuperada
├── Relatórios
├── Configurações
└── Administração / Master
```

## 4. Fluxo central do cliente

```text
Nome + Telefone
      ↓
Normalização do telefone
      ↓
Busca dentro da empresa/tenant
      ↓
┌───────────────┬────────────────┐
│ não encontrado│ encontrado     │
↓               ↓
Criar cliente   Recuperar cliente
└───────┬───────┴───────┬────────┘
        ↓               ↓
        Agendamento / Atendimento
                ↓
        Atendimento concluído
                ↓
     Consolidar visita comercial
        (dia local da unidade)
                ↓
          Atualizar histórico
                ↓
        Recalcular recorrência
                ↓
   Mediana dos intervalos recentes
                ↓
   Classificar estado de recorrência
                ↓
            Radar de risco
                ↓
        Ação de recuperação
                ↓
          Receita recuperada
```

Cancelamento e no-show não são visita concluída. Múltiplos atendimentos concluídos no mesmo dia comercial contam como uma visita para recorrência, sem eliminar seus efeitos financeiros válidos.

## 5. Contrato do Motor de Recorrência — B3

- Unidade de retorno: **visita comercial**, agrupada pela data local do timezone da unidade.
- Fonte: somente `attendances.status = completed` com `completed_at` válido.
- Histórico insuficiente não produz ciclo artificial.
- Estimador de ciclo do piloto: **mediana dos últimos N intervalos positivos**, default N=5, configurável em `recurrence_policies`.
- Os defaults de atenção/risco (20%/mínimo 3 dias; 50%/mínimo 7 dias) são **hipóteses calibráveis do piloto**, não regra universal do setor.
- Estados: `insufficient_history`, `normal`, `attention`, `at_risk`, `late`.
- Receita histórica: pagamentos alocados vinculados aos atendimentos concluídos menos estornos correspondentes, sempre dentro da empresa.
- Ticket médio: receita líquida histórica / número de visitas comerciais.
- Perfil em `client_recurrence_profiles` é cache derivado: usuários autenticados podem lê-lo conforme `clients.read`, mas não escrevê-lo diretamente.
- Recalculo ocorre por RPC controlada `SECURITY DEFINER`, com autenticação e autorização.
- Radar de recuperação usa sinal existente da família `revenue_risk`; oportunidade financeira de um retorno usa o ticket líquido por visita como evidência/impacto no MVP.
- O detector de recuperação exige autorização de Radar e leitura de clientes; acesso anônimo é vedado.

## 6. Isolamento e ambientes — regra de custo zero

Durante desenvolvimento e piloto, não criar projetos pagos ou infraestrutura adicional para obter isolamento ambiental.

Estratégia aprovada: isolamento lógico por empresa/tenant; RLS e verificações de permissão no banco; operações de teste reversíveis quando aplicável; dados de ensaio identificáveis/controlados; branches Git; nenhum segredo privado no frontend/repositório.

A separação física em múltiplos projetos/instâncias somente poderá ser reconsiderada após o piloto e mediante autorização explícita de custo.

## 7. Fluxo de desenvolvimento

```text
ÁRVORE / requisito aprovado
        ↓
Branch isolada
        ↓
Implementação
        ↓
Validação estática
        ↓
Testes funcionais / segurança
        ↓
Relatório técnico
        ↓
VALIDAÇÃO HUMANA
        ↓
Atualização da ÁRVORE + registro de evolução
        ↓
Merge / promoção autorizada
        ↓
Próximo bloco
```

## 8. Sequência de execução pós-C12

1. Sincronizar Árvore e baseline C12. **Concluído.**
2. Fechar gates técnicos já pendentes da C12 sem custo. **Em evolução contínua.**
3. Auditar e fechar `Nome + Telefone` como identidade operacional do cliente. **Base auditada; canonicalização BR permanece hardening separado.**
4. Completar Motor de Recorrência. **B3 aprovado e validado.**
5. Completar Radar → ação → receita recuperada. **Detector de recuperação integrado; orquestração automática e fechamento de receita recuperada seguem como próximo bloco.**
6. Executar hardening e E2E multi-tenant.
7. Validar visual desktop/mobile.
8. Usar Base44 apenas onde houver ganho comprovado sem substituir baseline/arquitetura.
9. Refinar assets visuais sem alterar arquitetura funcional.
10. Automatizar provisionamento somente com solução compatível com custo zero.
11. Piloto com 3–10 empresas.
12. Produzir materiais comerciais após evidência do piloto.

## 9. Definição de pronto de um bloco

Um bloco somente é **CONCLUÍDO** quando todos os itens aplicáveis estiverem satisfeitos: implementação/configuração; testes/evidências; custo adicional R$0; ausência de divergência não autorizada; validação humana; Árvore atualizada; Registro de Evolução atualizado; próximo gate identificado.

## 10. Registro de Evolução

| Data | Bloco | Alteração | Módulos/arquivos | Impacto | Evidência/Teste | Status | Próximo gate |
|---|---|---|---|---|---|---|---|
| 2026-09-16 | B1 | Auditoria Árvore × ZIP × GitHub | documentação/C12 | C12 definida como baseline executável | auditoria do repositório e relatório C12 | validado pelo usuário | B2 |
| 2026-09-16 | B2 | Sincronização arquitetural e protocolo documental | `docs/ARVORE_DO_SALUNEA.md` | documento vivo + custo zero + fluxo pós-C12 | branch documental isolada e merge aprovado | concluído | B3 |
| 2026-09-16 | B3 | Motor de recorrência + financeiro líquido + Radar de recuperação + hardening | migrations B3B–B3H; `client_recurrence_profiles`; `recurrence_policies`; RPCs de recorrência/Radar | transforma histórico concluído em ciclo, risco e oportunidade financeira multi-tenant | `docs/RELATORIO_VALIDACAO_B3_RECORRENCIA_RADAR_2026-09-16.md`; regressão real; cenários reversíveis; isolamento; estorno; Radar positivo | aprovado pelo usuário / documentação sincronizada | preparar merge PR #4 e iniciar Radar → ação → receita recuperada |

## 11. Pendências deliberadas pós-B3

- Calibrar thresholds com evidência real do piloto.
- Canonicalizar telefone brasileiro (+55/DDD/variações) sem quebrar unicidade por empresa.
- Avaliar recorrência específica por serviço após evidência de necessidade.
- Orquestrar atualização periódica do perfil e detector de recuperação sem custo adicional.
- Fechar ciclo de ação de recuperação e contabilização de receita recuperada.
- Normalizar convenção/versionamento das migrations entre repositório e histórico aplicado do Supabase antes da promoção final de ambiente.

## 12. Regra de manutenção documental

Toda alteração aprovada registra: o que mudou; módulo/arquivos; motivo; impacto; dependências/integrações; teste/evidência; status; posição no fluxo e próximo gate. A documentação faz parte da entrega técnica. Código e Árvore não podem evoluir de forma independente.
