-- B3D — dia comercial respeita timezone da unidade.
-- A unidade já possui timezone obrigatório (default America/Sao_Paulo).

create or replace function app.refresh_client_recurrence(p_company_id uuid,p_client_id uuid)
returns public.client_recurrence_profiles
language plpgsql security definer
set search_path=pg_catalog,public,app,pg_temp
as $$
declare
 v_profile public.client_recurrence_profiles; v_visits integer:=0; v_first timestamptz; v_last timestamptz;
 v_avg_days numeric(8,2); v_avg_ticket numeric(14,2):=0; v_lifetime numeric(14,2):=0;
 v_next timestamptz; v_days integer; v_status text:='insufficient_history';
begin
 if auth.uid() is null then raise exception 'Sessão expirada. Entre novamente.'; end if;
 if not app.has_permission('clients.read',p_company_id,null) then raise exception 'Sem permissão.'; end if;
 if not exists(select 1 from public.clients c where c.id=p_client_id and c.company_id=p_company_id and c.archived_at is null) then raise exception 'Cliente não encontrado nesta empresa.'; end if;

 with commercial_days as (
   select (a.completed_at at time zone u.timezone)::date visit_day,max(a.completed_at) completed_at
   from public.attendances a
   join public.units u on u.id=a.unit_id and u.company_id=a.company_id
   where a.company_id=p_company_id and a.client_id=p_client_id
     and a.status='completed' and a.completed_at is not null
   group by (a.completed_at at time zone u.timezone)::date
 ), sequenced as (
   select visit_day,completed_at,lag(visit_day) over(order by visit_day) previous_day from commercial_days
 )
 select count(*),min(completed_at),max(completed_at),round(avg((visit_day-previous_day)::numeric),2)
 into v_visits,v_first,v_last,v_avg_days from sequenced;

 select coalesce(avg(o.total_amount),0),coalesce(sum(o.total_amount),0)
 into v_avg_ticket,v_lifetime
 from public.orders o join public.attendances a on a.id=o.attendance_id
 where o.company_id=p_company_id and o.client_id=p_client_id and a.status='completed';

 if v_visits>=2 and v_avg_days is not null and v_avg_days>0 then
   v_next:=v_last+make_interval(secs=>(v_avg_days*86400)::double precision);
   v_days:=greatest(0,floor(extract(epoch from(now()-v_last))/86400)::integer);
   if now()<=v_next then v_status:='normal';
   elsif now()<=v_next+make_interval(secs=>(greatest(v_avg_days*0.20,3)*86400)::double precision) then v_status:='attention';
   elsif now()<=v_next+make_interval(secs=>(greatest(v_avg_days*0.50,7)*86400)::double precision) then v_status:='at_risk';
   else v_status:='late'; end if;
 elsif v_last is not null then v_days:=greatest(0,floor(extract(epoch from(now()-v_last))/86400)::integer); end if;

 insert into public.client_recurrence_profiles(company_id,client_id,completed_visits,first_completed_at,last_completed_at,average_return_days,next_expected_at,days_since_last_visit,average_ticket,lifetime_revenue,recurrence_status,calculated_at)
 values(p_company_id,p_client_id,v_visits,v_first,v_last,v_avg_days,v_next,v_days,v_avg_ticket,v_lifetime,v_status,now())
 on conflict(company_id,client_id) do update set completed_visits=excluded.completed_visits,first_completed_at=excluded.first_completed_at,last_completed_at=excluded.last_completed_at,average_return_days=excluded.average_return_days,next_expected_at=excluded.next_expected_at,days_since_last_visit=excluded.days_since_last_visit,average_ticket=excluded.average_ticket,lifetime_revenue=excluded.lifetime_revenue,recurrence_status=excluded.recurrence_status,calculated_at=excluded.calculated_at returning * into v_profile;
 return v_profile;
end; $$;
