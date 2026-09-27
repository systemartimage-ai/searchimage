-- A migration anterior (20260927000000_prevent_self_role_escalation.sql)
-- bloqueava troca de `role` quando quem executa não é admin — mas usava
-- só `not public.is_admin()`, sem checar se existe sessão de usuário
-- autenticada. O SQL Editor do Supabase (e scripts com service-role
-- key) rodam sem contexto de JWT — `auth.uid()` vem null ali — então
-- `is_admin()` também dá false, e a promoção manual legítima (a única
-- forma documentada de virar admin) ficava bloqueada junto (achado ao
-- tentar promover a própria conta pela primeira vez: erro
-- "Apenas administradores podem alterar o campo role."). Corrigido:
-- só bloqueia quando EXISTE uma sessão de usuário autenticada (alguém
-- logado pelo app tentando se autopromover) e essa sessão não é admin.

create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Apenas administradores podem alterar o campo role.';
  end if;
  return new;
end;
$$;
