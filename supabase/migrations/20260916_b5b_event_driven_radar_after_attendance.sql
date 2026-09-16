-- B5B — Orquestração event-driven sem scheduler externo.
-- Após concluir atendimento e abrir a comanda, atualiza o Radar da própria empresa/unidade.
-- O Radar é inteligência auxiliar: falha nele não pode desfazer a operação comercial principal.

create or replace function public.complete_attendance_and_open_order(p_attendance_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, app, pg_temp
as $$
declare
  v_order uuid;
  v_company uuid;
  v_unit uuid;
begin
  -- A rotina app existente continua sendo a autoridade para transição,
  -- permissões, idempotência, criação da comanda e totais.
  v_order := app.complete_attendance_and_open_order(p_attendance_id);

  select company_id, unit_id
    into v_company, v_unit
  from public.attendances
  where id = p_attendance_id;

  -- Só tenta o ciclo se a sessão também possuir radar.manage.
  -- Isso evita elevar privilégio além do contrato de RBAC existente.
  if v_company is not null and app.has_permission('radar.manage', v_company, v_unit) then
    begin
      perform app.run_radar_cycle(v_company, v_unit);
    exception when others then
      -- Não quebrar conclusão/abertura da comanda por falha de inteligência.
      null;
    end;
  end if;

  return v_order;
end
$$;

revoke all on function public.complete_attendance_and_open_order(uuid) from public, anon;
grant execute on function public.complete_attendance_and_open_order(uuid) to authenticated, service_role;
