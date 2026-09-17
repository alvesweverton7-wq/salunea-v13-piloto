begin;

create or replace function public.get_user_tenant_id()
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  return (
    select tenant_id
    from public.profiles
    where id = auth.uid()
  );
end;
$function$;

create or replace function public.is_software_master()
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'master_software_house'
  );
end;
$function$;

revoke execute on function public.get_user_tenant_id() from anon;
revoke execute on function public.is_software_master() from anon;

grant execute on function public.get_user_tenant_id() to authenticated;
grant execute on function public.is_software_master() to authenticated;

commit;
