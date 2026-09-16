-- B5A — Orquestração zero-custo do Radar.
-- Um único RPC autenticado executa os detectores geral + recuperação.
create or replace function app.run_radar_cycle(p_company uuid,p_unit uuid default null)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,public,app,pg_temp as $$
declare v_general integer:=0; v_recovery integer:=0;
begin
 if auth.uid() is null then raise exception 'Sessão expirada. Entre novamente.'; end if;
 if not app.has_permission('radar.manage',p_company,p_unit) then raise exception 'Sem permissão'; end if;
 v_general:=app.detect_radar_signals(p_company,p_unit);
 v_recovery:=app.detect_client_recovery_signals(p_company,p_unit);
 return jsonb_build_object('general_signals_touched',v_general,'recovery_signals_touched',v_recovery,'executed_at',now());
end $$;

create or replace function public.run_radar_cycle(p_company uuid,p_unit uuid default null)
returns jsonb language sql security invoker set search_path=pg_catalog,public,app,pg_temp as $$
 select app.run_radar_cycle(p_company,p_unit);
$$;

revoke all on function app.run_radar_cycle(uuid,uuid) from public,anon;
revoke all on function public.run_radar_cycle(uuid,uuid) from public,anon;
grant execute on function app.run_radar_cycle(uuid,uuid) to authenticated,service_role;
grant execute on function public.run_radar_cycle(uuid,uuid) to authenticated,service_role;
