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

## Estado em 2026-09-30

Timeout `57014` na busca resolvido conforme confirmação do usuário.
A migration `20260930030000_optimize_search_rls.sql` foi testada
localmente e aplicada pelo usuário no Supabase; após o reteste, ele
confirmou que a busca voltou a funcionar. Ver diagnóstico e limites
da validação na entrada de 2026-09-30 em `DIRETRIZES.md`.

Indicador verde "Produto ativo no site" implementado nos resultados,
com confirmação do estado e da origem no banco (última indexação).
Upload Admin e diretório local não recebem o indicador. Validado
localmente; publicação do front-end ainda pendente.

## Estado em 2026-10-01 (atualização: timeout e miniaturas)

Após o deploy, a busca por imagem voltou a dar `57014` e as miniaturas
quebraram na busca por texto. Causas e correções em `DIRETRIZES.md`
(entrada "Timeout 57014 na busca por imagem e miniaturas quebradas").
Migrations `20261001000000`, `20261001010000` e `20261001020000`
aplicadas no Supabase; a função retorna 100 linhas como `authenticated`.
Confirmação no site ainda pendente. Ao recriar `match_catalog_items_hybrid`,
manter `ci.image_url` e o forçamento do índice HNSW.

## Estado em 2026-10-01

Erro de texto `/class_head/Cast` reproduzido após falha do detector
OWL-ViT: as filas globais do Transformers.js 4.3.0 mantinham a Promise
rejeitada e contaminavam os modelos seguintes. Correção reproduzível
em `scripts/patchTransformersRuntime.mjs`, aplicada nos hooks npm;
dependência fixada em 4.3.0. Não remover o patch ou atualizar a versão
sem retestar recuperação e serialização. Texto após falha do detector
validado em navegador real; ainda requer publicação na Vercel.

Busca também passou a reaproveitar a última imagem/texto processado
nas novas tentativas e a evitar repetição automática de timeout SQL.
Detector com operador incompatível usa fallback nas próximas imagens
sem recarregar. Validação: 101 testes; deploy ainda pendente.

Atualização: front-end publicado em produção em 2026-10-01:
https://artimage-search.vercel.app. Deploy Vercel
`dpl_AnfTALDrpgqz89pj3BxUjZzXQ3eB` concluído com status READY.
HTTP 200 e bundle `index-J7JQ2t7V.js` confirmados no endereço de
produção, incluindo a nova mensagem de timeout. Fluxo autenticado
não retestado após este deploy; banco remoto não alterado nesta publicação.
