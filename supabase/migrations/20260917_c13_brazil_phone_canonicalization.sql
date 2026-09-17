-- C13: keep the entered phone intact while maintaining a strict BR canonical
-- value for WhatsApp identity and duplicate protection.

create or replace function app.br_phone_digits(p_value text)
returns text
language sql
immutable
parallel safe
set search_path = pg_catalog
as $$
  select case
    when length(d) in (10, 11) then '55' || d
    when length(d) in (12, 13) and left(d, 2) = '55' then d
    else null
  end
  from (select nullif(regexp_replace(coalesce(p_value, ''), '[^0-9]', '', 'g'), '') as d) s
$$;

alter table public.clients
  add column if not exists whatsapp_phone_digits text
  generated always as (app.br_phone_digits(phone)) stored;

create unique index if not exists clients_company_whatsapp_phone_active_uidx
  on public.clients (company_id, whatsapp_phone_digits)
  where archived_at is null and whatsapp_phone_digits is not null;

create index if not exists idx_clients_company_whatsapp_phone
  on public.clients (company_id, whatsapp_phone_digits)
  where archived_at is null;

create or replace function public.create_client(
  p_company_id uuid,
  p_full_name text,
  p_phone text default null
)
returns public.clients
language plpgsql
security definer
set search_path = pg_catalog, public, app, pg_temp
as $$
declare
  v_client public.clients;
  v_name text := btrim(coalesce(p_full_name, ''));
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_whatsapp_digits text := app.br_phone_digits(v_phone);
begin
  if auth.uid() is null then raise exception 'Sessão expirada. Entre novamente.'; end if;
  if v_name = '' then raise exception 'Informe o nome da cliente.'; end if;
  if not app.has_permission('clients.write', p_company_id, null) then
    raise exception 'Sem permissão para cadastrar clientes nesta empresa.';
  end if;
  if v_whatsapp_digits is not null and exists(
    select 1 from public.clients c
    where c.company_id = p_company_id
      and c.whatsapp_phone_digits = v_whatsapp_digits
      and c.archived_at is null
  ) then
    raise exception 'Já existe uma cliente com este telefone.';
  end if;

  insert into public.clients(company_id, full_name, phone, whatsapp_opt_in, status)
  values(p_company_id, v_name, v_phone, false, 'active')
  returning * into v_client;
  return v_client;
exception
  when unique_violation then
    raise exception 'Já existe uma cliente com este telefone.';
end
$$;
