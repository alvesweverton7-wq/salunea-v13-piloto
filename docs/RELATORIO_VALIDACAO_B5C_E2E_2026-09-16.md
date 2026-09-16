# Relatório B5C — E2E integrado

Data: 2026-09-16
Ambiente: Supabase dev `salao-saas-v1-dev`
Branch: `feat/b5-radar-orchestration-e2e`

## Objetivo
Validar, de forma reversível, que os blocos operacionais e de inteligência funcionam como um único sistema: atendimento → conclusão/comanda → Radar event-driven → recuperação → pagamento/fechamento → atribuição de receita.

## Teste 1 — conclusão real + gatilho Radar
Fixture agendado existente da empresa seed 1 foi iniciado pela RPC pública e concluído por `public.complete_attendance_and_open_order`.

Resultado antes do rollback forçado:
- attendance gerado: `995a38b3-ea19-4247-99fc-872354fb16a8`;
- order gerado: `30bcddfc-e87f-458b-a31b-bdf1752b7bf5`;
- attendance: `completed`;
- order: `open`;
- sinais Radar visíveis para a empresa/unidade após a conclusão: 2.

O bloco anônimo terminou deliberadamente com exceção `B5C_ROLLBACK_OK`, revertendo integralmente a fixture.

## Teste 2 — recuperação até receita líquida
No mesmo tipo de fixture, dentro de uma transação implicitamente revertida por exceção controlada:
1. política de atribuição de 30 dias configurada apenas para o teste;
2. ação de recuperação criada para o cliente;
3. ação marcada como contactada;
4. atendimento agendado iniciado;
5. atendimento concluído e comanda aberta pela RPC B5B;
6. pagamento PIX de R$80 registrado com chave idempotente de teste;
7. comanda fechada;
8. conversão da ação recalculada.

Resultado capturado antes do rollback forçado:
- status da ação: `converted`;
- total da comanda: R$80,00;
- `recovered_revenue`: R$80,00.

O teste terminou deliberadamente com exceção `B5C_FULL_ROLLBACK_OK`, portanto ação, alteração de política, atendimento, order e pagamento artificiais não permaneceram no banco.

## Conclusão
O caminho integrado principal foi comprovado no ambiente dev com dados reversíveis: operação comercial, gatilho de inteligência, recuperação e financeiro interoperam sem depender de scheduler ou mensageria paga.

## Limitações ainda abertas
- Este teste comprova integração transacional/funcional no backend, não substitui E2E de navegador.
- Concorrência verdadeiramente simultânea multi-sessão permanece desejável antes de produção.
- O gatilho B5B executa Radar somente quando o usuário da conclusão também possui `radar.manage`; usuários operacionais sem essa permissão não disparam o ciclo. Isso é deliberado para não elevar privilégios e deverá ser considerado na estratégia de cobertura operacional.
- Falhas internas do Radar são isoladas da conclusão do atendimento para não bloquear receita/operação; observabilidade desse erro deve ser tratada em hardening posterior.

## Gate
B5C funcional aprovado tecnicamente no dev. Próximo lote: hardening/observabilidade e definição de cobertura do gatilho sem violar RBAC nem custo zero, seguido de relatório consolidado B5 e gate humano.
