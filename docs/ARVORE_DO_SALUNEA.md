# ÁRVORE DO SALÚNEA — Documento Vivo

**Versão:** 2.0 — baseline pós-auditoria C12  
**Data:** 2026-09-16  
**Status:** proposta para validação humana  
**Autoridade:** este documento registra a arquitetura e o fluxo aprovados do Salúnea. Mudanças técnicas aprovadas devem ser refletidas aqui antes de um bloco ser considerado concluído.

## 1. Restrições invariantes

- Custo de produção e piloto: **R$ 0**. Usar somente free tiers, open-source ou recursos sem ônus.
- Preservar a arquitetura multi-tenant e os fluxos aprovados.
- `tenant_id`/empresa é a fronteira lógica de isolamento dos dados.
- Não criar rota arquitetural paralela sem validação humana.
- Mudanças devem ocorrer em bloco isolado, com teste e aprovação antes do próximo bloco.
- A branch `main` não deve receber mudanças de arquitetura sem validação do bloco correspondente.

## 2. Baseline técnico oficial

A release candidata C12 do repositório `salunea-v13-piloto` passa a ser o **baseline executável**.

O ZIP histórico permanece como referência visual/histórica e não deve substituir automaticamente a C12.

Componentes existentes na C12:

- autenticação Supabase;
- seleção de empresa/unidade;
- Dashboard;
- Agenda;
- Clientes;
- Atendimento/Comanda;
- Caixa;
- Estoque/Radar;
- Relatórios;
- Configurações;
- PWA/Service Worker;
- correção financeira de pagamentos líquidos após estornos.

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
│   ├── Ticket
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
│   ├── Radar de risco
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
          Atualizar histórico
                ↓
        Recalcular recorrência
                ↓
            Radar de risco
                ↓
        Ação de recuperação
                ↓
          Receita recuperada
```

Cancelamento e no-show não devem ser tratados como visita concluída.

## 5. Isolamento e ambientes — regra de custo zero

Durante desenvolvimento e piloto, não criar projetos pagos ou infraestrutura adicional para obter isolamento ambiental.

Estratégia aprovada para o período de custo zero:

- isolamento lógico por empresa/tenant;
- RLS e verificações de permissão no banco;
- operações de teste reversíveis quando aplicável;
- dados de ensaio identificáveis e controlados;
- branches Git para isolamento do código;
- nenhum segredo privado no frontend/repositório.

A separação física em múltiplos projetos/instâncias somente poderá ser reconsiderada após o piloto e mediante autorização explícita de custo.

## 6. Fluxo de desenvolvimento

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

## 7. Sequência de execução pós-C12

1. Sincronizar Árvore e baseline C12.
2. Fechar gates técnicos já pendentes da C12 sem custo.
3. Auditar e fechar `Nome + Telefone` como identidade operacional do cliente.
4. Completar Motor de Recorrência.
5. Completar Radar → ação → receita recuperada.
6. Executar hardening e E2E multi-tenant.
7. Validar visual desktop/mobile.
8. Usar Base44 apenas onde houver ganho comprovado sem substituir o baseline/arquitetura.
9. Refinar assets visuais sem alterar a arquitetura funcional.
10. Automatizar provisionamento somente com solução compatível com custo zero.
11. Piloto com 3–10 empresas.
12. Produzir materiais comerciais após evidência do piloto.

## 8. Definição de pronto de um bloco

Um bloco somente é **CONCLUÍDO** quando todos os itens aplicáveis estiverem satisfeitos:

- implementação/configuração concluída;
- testes executados e evidências registradas;
- custo adicional = R$ 0;
- ausência de divergência arquitetural não autorizada;
- validação humana recebida;
- Árvore atualizada;
- Registro de Evolução atualizado;
- próximo gate identificado.

## 9. Registro de Evolução

| Data | Bloco | Alteração | Módulos/arquivos | Impacto | Evidência/Teste | Status | Próximo gate |
|---|---|---|---|---|---|---|---|
| 2026-09-16 | B1 | Auditoria Árvore × ZIP × GitHub | documentação/C12 | C12 definida como baseline executável | auditoria do repositório e relatório C12 | validado pelo usuário | B2 |
| 2026-09-16 | B2 | Sincronização arquitetural e protocolo documental | `docs/ARVORE_DO_SALUNEA.md` | documento vivo + custo zero + fluxo pós-C12 | branch documental isolada | aguardando validação | auditoria Nome + Telefone / gates C12 |

## 10. Regra de manutenção documental

Toda alteração aprovada deve registrar, no mínimo:

1. o que mudou;
2. módulo e arquivos afetados;
3. motivo;
4. impacto arquitetural/funcional;
5. dependências e integrações afetadas;
6. teste/evidência;
7. status;
8. posição no fluxo e próximo gate.

A documentação faz parte da entrega técnica. Código e Árvore não podem evoluir de forma independente.
