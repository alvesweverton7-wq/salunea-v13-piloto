-- B3F — Radar de recuperação de clientes
-- Usa a família revenue_risk já existente; não cria arquitetura paralela.

create or replace function app.detect_client_recovery_signals(p_company uuid, p_unit uuid default null)
returns integer language plpgsql security definer
set search_path=pg_catalog,public,app,pg_temp as $$
declare r record; p public.client_recurrence_profiles; n integer:=0; rc integer:=0;
begin
  if auth.uid() is null then raise exception 'Sessão expirada. Entre novamente.'; end if;
  if not app.has_permission('radar.manage',p_company,p_unit) then raise exception 'Sem permissão'; end if;
  if not app.has_permission('clients.read',p_company,null) then raise exception 'Sem permissão para clientes'; end if;

  -- Atualiza os perfis de clientes com histórico concluído antes da detecção.
  for r in
    select distinct a.client_id
    from public.attendances a
    where a.company_id=p_company and a.client_id is not null and a.status='completed'
      and (p_unit is null or a.unit_id=p_unit)
  loop
    p:=app.refresh_client_recurrence(p_company,r.client_id);

    if p.recurrence_status in ('attention','at_risk','late') then
      insert into public.radar_signals(
        company_id,unit_id,family,signal_key,title_pt_br,diagnosis_pt_br,evidence,
        confidence,impact_amount,urgency,actionability,source_type,source_id
      ) values (
        p_company,p_unit,'revenue_risk','client_recovery_'||p.client_id::text,
        case p.recurrence_status
          when 'attention' then 'Cliente próximo do ciclo de retorno'
          when 'at_risk' then 'Cliente em risco de não retornar'
          else 'Cliente atrasado para retorno' end,
        'O histórico de visitas concluídas indica uma oportunidade de recuperação de relacionamento e receita.',
        jsonb_build_object(
          'client_id',p.client_id,'status',p.recurrence_status,
          'completed_visits',p.completed_visits,'average_return_days',p.average_return_days,
          'last_completed_at',p.last_completed_at,'next_expected_at',p.next_expected_at,
          'days_since_last_visit',p.days_since_last_visit,'average_ticket',p.average_ticket,
          'lifetime_revenue',p.lifetime_revenue
        ),
        case when p.completed_visits>=3 then 'high' else 'medium' end,
        greatest(p.average_ticket,0),
        case p.recurrence_status when 'attention' then 2 when 'at_risk' then 4 else 5 end,
        5,'client',p.client_id
      )
      on conflict(company_id,unit_id,signal_key,status) do update set
        title_pt_br=excluded.title_pt_br,diagnosis_pt_br=excluded.diagnosis_pt_br,
        evidence=excluded.evidence,confidence=excluded.confidence,
        impact_amount=excluded.impact_amount,urgency=excluded.urgency,
        actionability=excluded.actionability,detected_at=now(),updated_at=now();
      get diagnostics rc=row_count; n:=n+rc;
    else
      update public.radar_signals
         set status='resolved',resolved_at=now(),updated_at=now()
       where company_id=p_company and unit_id is not distinct from p_unit
         and signal_key='client_recovery_'||p.client_id::text and status in ('open','acknowledged');
    end if;
  end loop;
  return n;
end; $$;

revoke all on function app.detect_client_recovery_signals(uuid,uuid) from public,anon;
grant execute on function app.detect_client_recovery_signals(uuid,uuid) to authenticated;

create or replace function public.detect_client_recovery_signals(p_company uuid,p_unit uuid default null)
returns integer language sql security definer set search_path=pg_catalog,public,app,pg_temp
as $$ select app.detect_client_recovery_signals(p_company,p_unit) $$;
revoke all on function public.detect_client_recovery_signals(uuid,uuid) from public,anon;
grant execute on function public.detect_client_recovery_signals(uuid,uuid) to authenticated;
