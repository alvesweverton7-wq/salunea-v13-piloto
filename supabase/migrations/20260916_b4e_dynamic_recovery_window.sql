-- B4E — Janela dinâmica: ciclo individual + tolerância de risco, com teto opcional da empresa.
-- Não cria um default global arbitrário de dias.
create or replace function app.client_recovery_attribution_deadline(p_company_id uuid,p_client_id uuid,p_contacted_at timestamptz)
returns timestamptz language plpgsql security definer set search_path=pg_catalog,public,app,pg_temp as $$
declare v_cycle numeric; v_cap smallint; v_late_pct numeric:=0.50; v_late_min smallint:=7; v_days numeric;
begin
 if auth.uid() is null or not app.has_permission('clients.read',p_company_id,null) then raise exception 'Sem permissão.'; end if;
 select average_return_days into v_cycle from public.client_recurrence_profiles where company_id=p_company_id and client_id=p_client_id;
 select recovery_attribution_days,late_pct,late_min_days into v_cap,v_late_pct,v_late_min from public.recurrence_policies where company_id=p_company_id;
 if v_cycle is null or v_cycle<=0 then
   -- Sem histórico suficiente, somente uma política explícita da empresa habilita atribuição.
   if v_cap is null then return null; end if;
   return p_contacted_at + make_interval(days=>v_cap);
 end if;
 v_days := v_cycle + greatest(v_cycle*coalesce(v_late_pct,0.50),coalesce(v_late_min,7));
 if v_cap is not null then v_days:=least(v_days,v_cap); end if;
 return p_contacted_at + make_interval(days=>ceil(v_days)::int);
end $$;

create or replace function app.refresh_client_recovery_conversion(p_action_id uuid) returns public.client_recovery_actions
language plpgsql security definer set search_path=pg_catalog,public,app,pg_temp as $$
declare v public.client_recovery_actions; v_att uuid; v_order uuid; v_completed timestamptz; v_net numeric:=0; v_deadline timestamptz;
begin
 select * into v from public.client_recovery_actions where id=p_action_id for update;
 if not found then raise exception 'Ação não encontrada.'; end if;
 if auth.uid() is null or not app.has_permission('radar.manage',v.company_id,v.unit_id) then raise exception 'Sem permissão.'; end if;
 if v.contacted_at is null then return v; end if;
 v_deadline:=app.client_recovery_attribution_deadline(v.company_id,v.client_id,v.contacted_at);
 if v_deadline is null then return v; end if;
 select a.id,a.completed_at,o.id into v_att,v_completed,v_order from public.attendances a join public.orders o on o.attendance_id=a.id and o.company_id=a.company_id
 where a.company_id=v.company_id and a.client_id=v.client_id and a.status='completed' and a.completed_at>v.contacted_at and a.completed_at<=v_deadline
 and o.client_id=v.client_id and o.status='closed' and (v.unit_id is null or a.unit_id=v.unit_id)
 and not exists(select 1 from public.client_recovery_actions x where x.company_id=v.company_id and x.id<>v.id and (x.recovered_attendance_id=a.id or x.recovered_order_id=o.id))
 order by a.completed_at asc limit 1;
 if v_att is null then return v; end if;
 select greatest(0,coalesce((select sum(pa.amount) from public.payment_allocations pa where pa.company_id=v.company_id and pa.order_id=v_order),0)-coalesce((select sum(pr.amount) from public.payment_refunds pr where pr.company_id=v.company_id and pr.order_id=v_order),0)) into v_net;
 update public.client_recovery_actions set status='converted',converted_at=v_completed,recovered_attendance_id=v_att,recovered_order_id=v_order,recovered_revenue=v_net,updated_at=now() where id=p_action_id returning * into v;
 return v;
end $$;
revoke all on function app.client_recovery_attribution_deadline(uuid,uuid,timestamptz) from public,anon;
grant execute on function app.client_recovery_attribution_deadline(uuid,uuid,timestamptz) to authenticated,service_role;
