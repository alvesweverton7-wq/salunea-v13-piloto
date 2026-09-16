-- B3H — calibração auditável do motor de recorrência para o piloto
-- Hipóteses iniciais ficam explícitas e alteráveis sem reescrever a função.

create table if not exists public.recurrence_policies (
  company_id uuid primary key references public.companies(id) on delete cascade,
  recent_intervals smallint not null default 5 check (recent_intervals between 2 and 12),
  attention_pct numeric(6,3) not null default 0.20 check (attention_pct >= 0 and attention_pct <= 2),
  attention_min_days smallint not null default 3 check (attention_min_days >= 0),
  late_pct numeric(6,3) not null default 0.50 check (late_pct >= attention_pct and late_pct <= 3),
  late_min_days smallint not null default 7 check (late_min_days >= attention_min_days),
  updated_at timestamptz not null default now()
);
alter table public.recurrence_policies enable row level security;
revoke all on public.recurrence_policies from anon, authenticated;
grant select on public.recurrence_policies to authenticated;
create policy recurrence_policies_select on public.recurrence_policies for select to authenticated using (app.has_permission('clients.read',company_id,null));

create or replace function app.refresh_client_recurrence(p_company_id uuid,p_client_id uuid) returns public.client_recurrence_profiles
language plpgsql security definer set search_path=pg_catalog,public,app,pg_temp as $$
declare v_profile public.client_recurrence_profiles; v_visits integer:=0; v_first timestamptz; v_last timestamptz; v_cycle numeric(8,2); v_avg_ticket numeric(14,2):=0; v_lifetime numeric(14,2):=0; v_next timestamptz; v_days integer; v_status text:='insufficient_history'; v_n smallint:=5; v_attention numeric:=0.20; v_attention_days smallint:=3; v_late numeric:=0.50; v_late_days smallint:=7;
begin
 if auth.uid() is null then raise exception 'Sessão expirada. Entre novamente.'; end if;
 if not app.has_permission('clients.read',p_company_id,null) then raise exception 'Sem permissão.'; end if;
 if not exists(select 1 from public.clients c where c.id=p_client_id and c.company_id=p_company_id and c.archived_at is null) then raise exception 'Cliente não encontrado nesta empresa.'; end if;
 select recent_intervals,attention_pct,attention_min_days,late_pct,late_min_days into v_n,v_attention,v_attention_days,v_late,v_late_days from public.recurrence_policies where company_id=p_company_id;
 v_n:=coalesce(v_n,5); v_attention:=coalesce(v_attention,0.20); v_attention_days:=coalesce(v_attention_days,3); v_late:=coalesce(v_late,0.50); v_late_days:=coalesce(v_late_days,7);
 with commercial_days as (select (a.completed_at at time zone coalesce(u.timezone,'America/Sao_Paulo'))::date visit_day,max(a.completed_at) completed_at from public.attendances a left join public.units u on u.id=a.unit_id and u.company_id=a.company_id where a.company_id=p_company_id and a.client_id=p_client_id and a.status='completed' and a.completed_at is not null group by 1), seq as (select visit_day,completed_at,visit_day-lag(visit_day) over(order by visit_day) gap from commercial_days), recent as (select gap from seq where gap is not null and gap>0 order by visit_day desc limit v_n) select (select count(*) from commercial_days),(select min(completed_at) from commercial_days),(select max(completed_at) from commercial_days),(select round(percentile_cont(0.5) within group(order by gap)::numeric,2) from recent) into v_visits,v_first,v_last,v_cycle;
 with client_orders as (select distinct o.id from public.orders o join public.attendances a on a.id=o.attendance_id and a.company_id=o.company_id where o.company_id=p_company_id and o.client_id=p_client_id and a.status='completed'), paid as (select coalesce(sum(pa.amount),0)::numeric total from public.payment_allocations pa join client_orders co on co.id=pa.order_id where pa.company_id=p_company_id), refunded as (select coalesce(sum(pr.amount),0)::numeric total from public.payment_refunds pr join client_orders co on co.id=pr.order_id where pr.company_id=p_company_id) select greatest(0,paid.total-refunded.total) into v_lifetime from paid,refunded;
 if v_visits>0 then v_avg_ticket:=round(v_lifetime/v_visits,2); end if;
 if v_visits>=2 and v_cycle is not null and v_cycle>0 then v_next:=v_last+make_interval(secs=>(v_cycle*86400)::double precision); v_days:=greatest(0,floor(extract(epoch from(now()-v_last))/86400)::integer); if now()<=v_next then v_status:='normal'; elsif now()<=v_next+make_interval(secs=>(greatest(v_cycle*v_attention,v_attention_days)*86400)::double precision) then v_status:='attention'; elsif now()<=v_next+make_interval(secs=>(greatest(v_cycle*v_late,v_late_days)*86400)::double precision) then v_status:='at_risk'; else v_status:='late'; end if; elsif v_last is not null then v_days:=greatest(0,floor(extract(epoch from(now()-v_last))/86400)::integer); end if;
 insert into public.client_recurrence_profiles(company_id,client_id,completed_visits,first_completed_at,last_completed_at,average_return_days,next_expected_at,days_since_last_visit,average_ticket,lifetime_revenue,recurrence_status,calculated_at) values(p_company_id,p_client_id,v_visits,v_first,v_last,v_cycle,v_next,v_days,v_avg_ticket,v_lifetime,v_status,now()) on conflict(company_id,client_id) do update set completed_visits=excluded.completed_visits,first_completed_at=excluded.first_completed_at,last_completed_at=excluded.last_completed_at,average_return_days=excluded.average_return_days,next_expected_at=excluded.next_expected_at,days_since_last_visit=excluded.days_since_last_visit,average_ticket=excluded.average_ticket,lifetime_revenue=excluded.lifetime_revenue,recurrence_status=excluded.recurrence_status,calculated_at=excluded.calculated_at returning * into v_profile; return v_profile;
end; $$;
