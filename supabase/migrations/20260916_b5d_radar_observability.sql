-- B5D — Observabilidade do ciclo Radar sem infraestrutura externa.
-- Reutiliza audit_logs append-only já existente.
-- Não altera o resultado da operação principal se a telemetria falhar.

create or replace function app.run_radar_cycle(p_company uuid, p_unit uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, app, pg_temp
as $$
declare
  v_general integer := 0;
  v_recovery integer := 0;
  v_started timestamptz := clock_timestamp();
  v_actor uuid;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Sessão expirada. Entre novamente.';
  end if;
  if not app.has_permission('radar.manage', p_company, p_unit) then
    raise exception 'Sem permissão';
  end if;

  select u.id into v_actor
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1;

  v_general := app.detect_radar_signals(p_company, p_unit);
  v_recovery := app.detect_client_recovery_signals(p_company, p_unit);

  v_result := jsonb_build_object(
    'executed_at', now(),
    'general_signals_touched', v_general,
    'recovery_signals_touched', v_recovery
  );

  begin
    insert into public.audit_logs(
      company_id, unit_id, actor_type, actor_id, action, entity_type, reason, metadata
    ) values (
      p_company, p_unit, 'user', v_actor, 'radar.cycle.completed', 'radar_cycle',
      'Ciclo Radar executado',
      v_result || jsonb_build_object(
        'duration_ms', greatest(0, round(extract(epoch from (clock_timestamp()-v_started))*1000))
      )
    );
  exception when others then
    null;
  end;

  return v_result;
exception when others then
  begin
    insert into public.audit_logs(
      company_id, unit_id, actor_type, actor_id, action, entity_type, reason, metadata
    ) values (
      p_company, p_unit, 'user', v_actor, 'radar.cycle.failed', 'radar_cycle',
      sqlerrm,
      jsonb_build_object(
        'duration_ms', greatest(0, round(extract(epoch from (clock_timestamp()-v_started))*1000)),
        'sqlstate', sqlstate
      )
    );
  exception when others then
    null;
  end;
  raise;
end
$$;

revoke all on function app.run_radar_cycle(uuid,uuid) from public, anon;
grant execute on function app.run_radar_cycle(uuid,uuid) to authenticated, service_role;
