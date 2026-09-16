-- B3G — hardening de segurança do cache derivado de recorrência
-- O perfil é derivado do histórico operacional e não deve ser editável diretamente pelo cliente autenticado.

-- Remove política de escrita direta. A leitura multi-tenant permanece protegida por clients.read.
drop policy if exists client_recurrence_profiles_manage on public.client_recurrence_profiles;

-- Defesa em profundidade: authenticated lê o cache, mas não altera diretamente.
revoke insert, update, delete, truncate, references, trigger
  on public.client_recurrence_profiles from authenticated;
grant select on public.client_recurrence_profiles to authenticated;

-- O cálculo continua ocorrendo exclusivamente pelas funções SECURITY DEFINER,
-- que validam auth.uid() e permissão antes de escrever o cache.
revoke all on function app.refresh_client_recurrence(uuid,uuid) from public, anon;
grant execute on function app.refresh_client_recurrence(uuid,uuid) to authenticated, service_role;

revoke all on function public.refresh_client_recurrence(uuid,uuid) from public, anon;
grant execute on function public.refresh_client_recurrence(uuid,uuid) to authenticated, service_role;

revoke all on function app.detect_client_recovery_signals(uuid,uuid) from public, anon;
grant execute on function app.detect_client_recovery_signals(uuid,uuid) to authenticated, service_role;

revoke all on function public.detect_client_recovery_signals(uuid,uuid) from public, anon;
grant execute on function public.detect_client_recovery_signals(uuid,uuid) to authenticated, service_role;
