-- B4C — atribuição conservadora, auditável e sem dupla contagem
alter table public.recurrence_policies add column if not exists recovery_attribution_days smallint check(recovery_attribution_days between 1 and 365);

-- Um retorno financeiro só pode ser atribuído a uma ação de recuperação.
create unique index if not exists client_recovery_one_attendance_idx on public.client_recovery_actions(company_id,recovered_attendance_id) where recovered_attendance_id is not null;
create unique index if not exists client_recovery_one_order_idx on public.client_recovery_actions(company_id,recovered_order_id) where recovered_order_id is not null;

create or replace function app.refresh_client_recovery_conversion(p_action_id uuid) returns public.client_recovery_actions
language plpgsql security definer set search_path=pg_catalog,public,app,pg_temp as $$
declare v public.client_recovery_actions; v_att uuid; v_order uuid; v_completed timestamptz; v_net numeric:=0; v_window smallint;
begin
 select * into v from public.client_recovery_actions where id=p_action_id for update;
 if not found then raise exception 'Ação não encontrada.'; end if;
 if auth.uid() is null or not app.has_permission('radar.manage',v.company_id,v.unit_id) then raise exception 'Sem permissão.'; end if;
 if v.contacted_at is null then return v; end if;
 select recovery_attribution_days into v_window from public.recurrence_policies where company_id=v.company_id;
 -- NULL = sem janela aprovada: não atribuir automaticamente. Evita inventar regra de produto.
 if v_window is null then return v; end if;
 select a.id,a.completed_at,o.id into v_att,v_completed,v_order
 from public.attendances a join public.orders o on o.attendance_id=a.id and o.company_id=a.company_id
 where a.company_id=v.company_id and a.client_id=v.client_id and a.status='completed' and a.completed_at>v.contacted_at
   and a.completed_at<=v.contacted_at+make_interval(days=>v_window)
   and o.client_id=v.client_id and o.status='closed' and (v.unit_id is null or a.unit_id=v.unit_id)
   and not exists(select 1 from public.client_recovery_actions x where x.company_id=v.company_id and x.id<>v.id and (x.recovered_attendance_id=a.id or x.recovered_order_id=o.id))
 order by a.completed_at asc limit 1;
 if v_att is null then return v; end if;
 select greatest(0,coalesce((select sum(pa.amount) from public.payment_allocations pa where pa.company_id=v.company_id and pa.order_id=v_order),0)-coalesce((select sum(pr.amount) from public.payment_refunds pr where pr.company_id=v.company_id and pr.order_id=v_order),0)) into v_net;
 update public.client_recovery_actions set status='converted',converted_at=v_completed,recovered_attendance_id=v_att,recovered_order_id=v_order,recovered_revenue=v_net,updated_at=now() where id=p_action_id returning * into v;
 return v;
end $$;
