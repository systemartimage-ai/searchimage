-- O painel de admin precisa listar usuários (e-mail + papel) pra
-- conceder/revogar acesso à ferramenta de upload. O e-mail só existe
-- em auth.users, que o navegador não consegue consultar diretamente
-- (schema interno do Supabase, não exposto via PostgREST). Em vez de
-- criar uma view cruzando com auth.users, copia o e-mail pra
-- public.profiles no momento do cadastro — já é uma tabela que o
-- admin já pode ler por completo (policy profiles_admin_all).

alter table public.profiles add column email text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email) values (new.id, 'USER', new.email);
  return new;
end;
$$;

-- Preenche o e-mail de quem já tinha se cadastrado antes dessa migration.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;
