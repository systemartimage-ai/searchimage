# Search Image

Aplicação web de busca visual por imagem, com duas fontes de pesquisa: um
catálogo web pré-indexado (Supabase/pgvector) e um diretório local
explicitamente autorizado pelo usuário.

A especificação funcional completa do produto está nos documentos
`00_README_MASTER.md` a `07_TESTES_DEPLOY_OPERACAO.md` na raiz do
repositório — leia-os antes de mudanças estruturais. `CLAUDE.md` e
`DIRETRIZES.md` definem o protocolo de trabalho.

## Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres, pgvector, Storage)
- Vitest + Testing Library

## Setup local

```bash
npm install
cp .env.example .env.local   # preencher VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

Abre em **http://localhost:5183** (porta fixa deste projeto — ver
`vite.config.ts` — para não colidir com outros projetos Vite rodando
na porta padrão 5173).

## Scripts

| Script                 | Descrição                           |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento         |
| `npm run build`        | Build de produção (`tsc -b` + Vite) |
| `npm run preview`      | Preview do build de produção        |
| `npm run lint`         | ESLint                              |
| `npm run format`       | Prettier (escreve)                  |
| `npm run format:check` | Prettier (checagem, usado em CI)    |
| `npm run typecheck`    | `tsc` sem emitir arquivos           |
| `npm run test`         | Testes (Vitest)                     |

## Estrutura

```
src/
  domains/        # auth, search, catalog, local-directory, embedding, sources, admin/indexing
  components/ui/  # componentes shadcn/ui
  lib/            # client Supabase, utilitários
  routes/         # rotas da aplicação
  types/          # tipos compartilhados
```

## Segurança

Nunca commitar `.env`/`.env.local`. A `service-role key` do Supabase e a
chave do provedor de embeddings só existem no back-end/indexador — jamais
no bundle do front-end.
