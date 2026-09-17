begin;

alter policy "Isolamento de agendamentos por tenant" on public.agendamentos to authenticated;
alter policy "Isolamento de clientes por tenant" on public.clientes to authenticated;
alter policy "Acesso a perfis do mesmo tenant ou master" on public.profiles to authenticated;
alter policy "Isolamento de profissionais por tenant" on public.profissionais to authenticated;
alter policy "Isolamento de servicos por tenant" on public.servicos to authenticated;
alter policy "Master gerencia tenants" on public.tenants to authenticated;

commit;
