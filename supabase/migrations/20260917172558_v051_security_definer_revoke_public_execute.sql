begin;
revoke execute on function public.get_user_tenant_id() from public;
revoke execute on function public.is_software_master() from public;
grant execute on function public.get_user_tenant_id() to authenticated;
grant execute on function public.is_software_master() to authenticated;
commit;
