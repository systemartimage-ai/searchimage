# SEARCH IMAGE --- ARQUITETURA

## Componentes

### Web App

Responsável por autenticação, upload da imagem de consulta, seleção da
fonte, filtros e resultados.

### Admin

Área protegida para: - fontes; - indexações; - reindexações; -
versões; - falhas; - métricas; - ativação/rollback do índice.

### Indexer

Pipeline independente: 1. Descobrir páginas/itens. 2. Extrair imagens e
metadados. 3. Normalizar URL/código/título. 4. Evitar duplicatas. 5.
Baixar/processar imagem. 6. Gerar embedding. 7. Gravar registro e vetor. 8. Validar lote. 9. Publicar versão.

### EmbeddingProvider

Criar interface desacoplada: - `embedImage(image)` -
`embedBatch(images)` - `modelVersion` - `vectorDimension`

Nunca espalhar chamadas específicas do fornecedor pela aplicação.

### SearchEngine

Recebe embedding da consulta, fonte e filtros. Executa nearest-neighbor
no pgvector e retorna resultados ordenados.

## Modelo de implantação

### GitHub

Código, migrations, documentação e CI. Não armazenar imagens de catálogo
nem segredos.

### Supabase

- Auth
- Postgres
- pgvector
- Storage
- funções/RPC necessárias
- RLS

### Vercel/Netlify

Front-end e endpoints compatíveis. Processos longos de
crawling/indexação não devem depender de uma função serverless curta.
Para catálogos grandes, executar indexador como job/worker apropriado.

## Fronteiras

`UI -> API/Server -> Search Service -> Supabase`

`Admin -> Index Job -> Crawler/Importer -> Embedding Provider -> Supabase`

## Escalabilidade

Preparar processamento em lotes, checkpoint, retry, idempotência e
concorrência controlada.

## Deduplicação

Guardar hash do conteúdo da imagem e URL normalizada. Não gerar novo
embedding quando a imagem não mudou e o modelo também não mudou.

## Metadados mínimos por item

- source_id
- external_id/código
- título
- descrição opcional
- page_url
- image_url original
- thumbnail/storage path opcional
- image_hash
- embedding
- embedding_model
- embedding_version
- index_version_id
- timestamps
- status

## Multi-fonte

Arquitetura deve aceitar no futuro vários catálogos. Cada item pertence
a uma `source`.

## Resultado

Cada resultado deve carregar: - imagem; - similaridade/distância; -
código; - nome; - origem; - URL original; - metadados úteis.
