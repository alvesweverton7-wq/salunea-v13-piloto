-- B4A — Radar -> ação de recuperação auditável
create table public.client_recovery_actions (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete restrict,
 unit_id uuid references public.units(id) on delete restrict, client_id uuid not null references public.clients(id) on delete restrict,
 radar_signal_id uuid references public.radar_signals(id) on delete restrict,
 channel text not null check(channel in ('phone','whatsapp','in_person','other')),
 status text not null default 'planned' check(status in ('planned','contacted','responded','converted','dismissed')),
 contacted_at timestamptz, converted_at timestamptz, recovered_attendance_id uuid references public.attendances(id) on delete restrict,
 recovered_order_id uuid references public.orders(id) on delete restrict, recovered_revenue numeric(14,2) not null default 0 check(recovered_revenue>=0),
 created_by uuid not null references public.users(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((status<>'converted') or (converted_at is not null and recovered_attendance_id is not null and recovered_order_id is not null))
);
create index client_recovery_actions_company_client_idx on public.client_recovery_actions(company_id,client_id,created_at desc);
create index client_recovery_actions_signal_idx on public.client_recovery_actions(company_id,radar_signal_id) where radar_signal_id is not null;
alter table public.client_recovery_actions enable row level security;
create policy client_recovery_actions_read on public.client_recovery_actions for select to authenticated using(app.has_permission('radar.read',company_id,unit_id));
revoke all on public.client_recovery_actions from anon,authenticated;
grant select on public.client_recovery_actions to authenticated;

create or replace function app.create_client_recovery_action(p_company_id uuid,p_client_id uuid,p_radar_signal_id uuid,p_unit_id uuid,p_channel text) returns public.client_recovery_actions
language plpgsql security definer set search_path=pg_catalog,public,app,pg_temp as $$ declare v public.client_recovery_actions; v_user uuid; begin
 if auth.uid() is null then raise exception 'Sessão expirada. Entre novamente.'; end if;
 if not app.has_permission('radar.manage',p_company_id,p_unit_id) or not app.has_permission('clients.read',p_company_id,p_unit_id) then raise exception 'Sem permissão.'; end if;
 select id into v_user from public.users where auth_user_id=auth.uid(); if v_user is null then raise exception 'Usuário não encontrado.'; end if;
 if not exists(select 1 from public.clients where id=p_client_id and company_id=p_company_id and archived_at is null) then raise exception 'Cliente inválido para esta empresa.'; end if;
 if p_unit_id is not null and not exists(select 1 from public.units where id=p_unit_id and company_id=p_company_id) then raise exception 'Unidade inválida.'; end if;
 if p_radar_signal_id is not null and not exists(select 1 from public.radar_signals where id=p_radar_signal_id and company_id=p_company_id and source_type='client' and source_id=p_client_id) then raise exception 'Sinal Radar incompatível.'; end if;
 if p_channel not in ('phone','whatsapp','in_person','other') then raise exception 'Canal inválido.'; end if;
 if p_channel='whatsapp' and not exists(select 1 from public.clients where id=p_client_id and company_id=p_company_id and whatsapp_opt_in=true and whatsapp_revoked_at is null) then raise exception 'Cliente sem consentimento WhatsApp ativo.'; end if;
 insert into public.client_recovery_actions(company_id,unit_id,client_id,radar_signal_id,channel,created_by) values(p_company_id,p_unit_id,p_client_id,p_radar_signal_id,p_channel,v_user) returning * into v; return v; end $$;
create or replace function public.create_client_recovery_action(p_company_id uuid,p_client_id uuid,p_radar_signal_id uuid default null,p_unit_id uuid default null,p_channel text default 'phone') returns public.client_recovery_actions language sql security invoker set search_path=pg_catalog,public,app,pg_temp as $$ select app.create_client_recovery_action(p_company_id,p_client_id,p_radar_signal_id,p_unit_id,p_channel); $$;

create or replace function app.mark_client_recovery_contacted(p_action_id uuid) returns public.client_recovery_actions language plpgsql security definer set search_path=pg_catalog,public,app,pg_temp as $$ declare v public.client_recovery_actions; begin
 select * into v from public.client_recovery_actions where id=p_action_id for update; if not found then raise exception 'Ação não encontrada.'; end if;
 if auth.uid() is null or not app.has_permission('radar.manage',v.company_id,v.unit_id) then raise exception 'Sem permissão.'; end if;
 update public.client_recovery_actions set status='contacted',contacted_at=coalesce(contacted_at,now()),updated_at=now() where id=p_action_id returning * into v; return v; end $$;
create or replace function public.mark_client_recovery_contacted(p_action_id uuid) returns public.client_recovery_actions language sql security invoker set search_path=pg_catalog,public,app,pg_temp as $$ select app.mark_client_recovery_contacted(p_action_id); $$;

create or replace function app.refresh_client_recovery_conversion(p_action_id uuid) returns public.client_recovery_actions language plpgsql security definer set search_path=pg_catalog,public,app,pg_temp as $$ declare v public.client_recovery_actions; v_att uuid; v_order uuid; v_completed timestamptz; v_net numeric:=0; begin
 select * into v from public.client_recovery_actions where id=p_action_id for update; if not found then raise exception 'Ação não encontrada.'; end if;
 if auth.uid() is null or not app.has_permission('radar.manage',v.company_id,v.unit_id) then raise exception 'Sem permissão.'; end if;
 if v.contacted_at is null then return v; end if;
 select a.id,a.completed_at,o.id into v_att,v_completed,v_order from public.attendances a join public.orders o on o.attendance_id=a.id and o.company_id=a.company_id where a.company_id=v.company_id and a.client_id=v.client_id and a.status='completed' and a.completed_at>v.contacted_at and o.client_id=v.client_id and o.status='closed' and (v.unit_id is null or a.unit_id=v.unit_id) order by a.completed_at asc limit 1;
 if v_att is null then return v; end if;
 select greatest(0,coalesce((select sum(pa.amount) from public.payment_allocations pa where pa.company_id=v.company_id and pa.order_id=v_order),0)-coalesce((select sum(pr.amount) from public.payment_refunds pr where pr.company_id=v.company_id and pr.order_id=v_order),0)) into v_net;
 update public.client_recovery_actions set status='converted',converted_at=v_completed,recovered_attendance_id=v_att,recovered_order_id=v_order,recovered_revenue=v_net,updated_at=now() where id=p_action_id returning * into v; return v; end $$;
create or replace function public.refresh_client_recovery_conversion(p_action_id uuid) returns public.client_recovery_actions language sql security invoker set search_path=pg_catalog,public,app,pg_temp as $$ select app.refresh_client_recovery_conversion(p_action_id); $$;

revoke all on function app.create_client_recovery_action(uuid,uuid,uuid,uuid,text),app.mark_client_recovery_contacted(uuid),app.refresh_client_recovery_conversion(uuid) from public,anon;
revoke all on function public.create_client_recovery_action(uuid,uuid,uuid,uuid,text),public.mark_client_recovery_contacted(uuid),public.refresh_client_recovery_conversion(uuid) from public,anon;
grant execute on function public.create_client_recovery_action(uuid,uuid,uuid,uuid,text),public.mark_client_recovery_contacted(uuid),public.refresh_client_recovery_conversion(uuid) to authenticated,service_role;
