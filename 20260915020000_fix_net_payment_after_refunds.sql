-- C12: make open-order balance and close eligibility use net payments after refunds.
-- The order remains closed after a post-close refund to preserve the commercial
-- history; reports and UI must present gross, refunded and net amounts separately.

create or replace function app.receive_order_payment(
  p_order_id uuid,
  p_payment_method text,
  p_amount numeric,
  p_idempotency_key text
)
returns uuid
language plpgsql
set search_path to 'pg_catalog', 'public', 'app'
as $function$
declare
  v_o public.orders%rowtype;
  v_payment uuid;
  v_paid numeric(14,2);
  v_remaining numeric(14,2);
  v_key text := nullif(btrim(p_idempotency_key), '');
begin
  select * into v_o
  from public.orders
  where id = p_order_id
  for update;

  if not found then raise exception 'Comanda não encontrada'; end if;
  if not app.has_permission('payments.write', v_o.company_id, v_o.unit_id) then
    raise exception 'Sem permissão para registrar pagamento';
  end if;

  if v_key is not null then
    select pr.id into v_payment
    from public.payment_records pr
    where pr.company_id = v_o.company_id
      and pr.order_id = v_o.id
      and pr.idempotency_key = v_key
      and pr.status <> 'cancelled'
    limit 1;
    if v_payment is not null then return v_payment; end if;
  end if;

  if v_o.status <> 'open' then raise exception 'Comanda não está aberta'; end if;
  if p_payment_method not in (
    'cash','pix','debit_card','credit_card','bank_transfer',
    'deposit_credit','package_credit','other'
  ) then
    raise exception 'Forma de pagamento inválida';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Valor deve ser maior que zero';
  end if;

  select coalesce(sum(greatest(0, x.allocated_amount - x.refunded_amount)), 0)
  into v_paid
  from (
    select
      pa.payment_record_id,
      sum(pa.amount)::numeric as allocated_amount,
      coalesce((
        select sum(prf.amount)
        from public.payment_refunds prf
        where prf.payment_record_id = pa.payment_record_id
      ), 0)::numeric as refunded_amount
    from public.payment_allocations pa
    join public.payment_records pr on pr.id = pa.payment_record_id
    where pa.order_id = v_o.id
      and pr.status in ('received','partially_refunded','refunded')
    group by pa.payment_record_id
  ) x;

  v_remaining := round(v_o.total_amount - v_paid, 2);
  if p_amount > v_remaining then
    raise exception 'Pagamento excede saldo líquido da comanda. Saldo: %', v_remaining;
  end if;

  insert into public.payment_records(
    company_id, unit_id, order_id, payment_method, amount, status,
    occurred_at, actual_receipt_at, created_by, idempotency_key
  ) values (
    v_o.company_id, v_o.unit_id, v_o.id, p_payment_method, round(p_amount, 2),
    'received', now(), now(), app.current_user_id(), v_key
  ) returning id into v_payment;

  insert into public.payment_allocations(
    company_id, unit_id, payment_record_id, order_id, amount
  ) values (
    v_o.company_id, v_o.unit_id, v_payment, v_o.id, round(p_amount, 2)
  );

  return v_payment;
exception
  when unique_violation then
    if v_key is not null then
      select pr.id into v_payment
      from public.payment_records pr
      where pr.company_id = v_o.company_id
        and pr.order_id = v_o.id
        and pr.idempotency_key = v_key
        and pr.status <> 'cancelled'
      limit 1;
      if v_payment is not null then return v_payment; end if;
    end if;
    raise;
end
$function$;

create or replace function app.close_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'app', 'pg_temp'
as $function$
declare
  v_order public.orders;
  v_paid numeric(14,2);
  v_attendance_status text;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if v_order.id is null then raise exception 'Comanda inexistente'; end if;
  if not app.has_permission('orders.write', v_order.company_id, v_order.unit_id) then
    raise exception 'Sem permissão para fechar comanda';
  end if;
  if v_order.status <> 'open' then raise exception 'Comanda não está aberta'; end if;

  if v_order.attendance_id is not null then
    select status into v_attendance_status
    from public.attendances
    where id = v_order.attendance_id;
    if v_attendance_status <> 'completed' then
      raise exception 'Atendimento deve estar concluído antes de fechar a comanda';
    end if;
  end if;

  perform app.recalculate_order_totals(v_order.id);
  select * into v_order from public.orders where id = p_order_id;

  select coalesce(sum(greatest(0, x.allocated_amount - x.refunded_amount)), 0)
  into v_paid
  from (
    select
      pa.payment_record_id,
      sum(pa.amount)::numeric as allocated_amount,
      coalesce((
        select sum(prf.amount)
        from public.payment_refunds prf
        where prf.payment_record_id = pa.payment_record_id
      ), 0)::numeric as refunded_amount
    from public.payment_allocations pa
    join public.payment_records pr on pr.id = pa.payment_record_id
    where pa.order_id = v_order.id
      and pr.status in ('received','partially_refunded','refunded')
    group by pa.payment_record_id
  ) x;

  if round(v_paid, 2) <> round(v_order.total_amount, 2) then
    raise exception
      'Comanda deve estar integralmente recebida pelo valor líquido antes do fechamento. Total: %, recebido líquido: %',
      v_order.total_amount, v_paid;
  end if;

  update public.orders
  set status = 'closed',
      closed_at = now(),
      closed_by = app.current_user_id(),
      updated_at = now()
  where id = v_order.id
  returning * into v_order;

  return v_order;
end
$function$;

revoke all on function app.receive_order_payment(uuid,text,numeric,text) from public, anon;
revoke all on function app.close_order(uuid) from public, anon;

