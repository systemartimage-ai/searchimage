-- Achado revisando RLS pra construir a ferramenta de upload admin:
-- a policy "profiles_update_own" (using/with check: auth.uid() = id)
-- restringe QUAL LINHA um usuário pode alterar, mas não QUAIS COLUNAS —
-- qualquer usuário autenticado podia rodar
--   update profiles set role = 'ADMIN' where id = auth.uid()
-- pelo próprio client (anon key) e se autopromover, já que não existe
-- grant/trigger nenhum restringindo a coluna `role`. Bloqueia aqui:
-- troca de `role` só é permitida se quem está fazendo a alteração
-- (auth.uid(), não a linha sendo alterada) já for admin.

create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Apenas administradores podem alterar o campo role.';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_self_role_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_self_role_escalation();
