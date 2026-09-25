# CLAUDE.md --- SEARCH IMAGE

Você está trabalhando no projeto **Search Image**.

## Missão

Construir uma aplicação web de busca visual com duas fontes: 1. catálogo
web previamente indexado; 2. diretório local explicitamente autorizado
pelo usuário.

## Regras permanentes

- Leia todos os documentos do projeto antes de mudanças estruturais.
- Não trate crawling em tempo real como mecanismo normal de busca.
- O índice ativo nunca pode ser destruído antes de uma nova versão
  validada.
- Não exponha segredos no front-end.
- GitHub contém código/documentação, não credenciais.
- Supabase concentra Auth/Postgres/pgvector e Storage quando
  necessário.
- Encapsule IA em `EmbeddingProvider`.
- Encapsule fontes em adaptadores.
- Faça migrations; não dependa de alterações manuais não documentadas.
- Teste antes e depois.
- Inspecione também UX, responsividade, erros e estados vazios.
- Atualize estes `.md` quando uma decisão for alterada.

## Protocolo de trabalho

Para cada tarefa: 1. releia contexto; 2. inspecione código; 3.
identifique dependências/riscos; 4. implemente; 5. rode
lint/typecheck/test/build; 6. abra e teste o fluxo; 7. corrija; 8. rode
testes novamente; 9. reporte arquivos alterados, testes e pendências.

## Segurança

Nunca commitar `.env`, senha, token, cookie de sessão ou service-role
key.

## Prioridade

Corretude \> segurança \> simplicidade \> UX \> otimização prematura.

## Não inventar

Se uma integração depende do site-fonte real, não invente seletor, API
ou autenticação. Crie a interface/adaptador e solicite o dado necessário
na etapa adequada.
