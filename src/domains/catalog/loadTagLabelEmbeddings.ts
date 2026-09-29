import type { TagLabelEmbeddings } from './tagClassifier'

// Asset estático (~250KB) com os embeddings dos rótulos da taxonomia —
// carregado sob demanda (dynamic import, vira chunk separado) e
// cacheado no módulo, já que não muda entre chamadas na mesma sessão.
// Usado tanto na busca por imagem (useImageSearch.ts) quanto no upload
// em massa de admin (classificação completa de tags no upload).
let tagLabelEmbeddingsPromise: Promise<TagLabelEmbeddings> | null = null

export function loadTagLabelEmbeddings(): Promise<TagLabelEmbeddings> {
  if (!tagLabelEmbeddingsPromise) {
    // Achado real (mesmo padrão de ClipEmbeddingProvider.ts): cache de
    // Promise REJEITADA travaria a busca pra sempre depois de uma falha
    // pontual de carregamento do chunk — limpa o cache no erro.
    tagLabelEmbeddingsPromise = import('./tagLabelEmbeddings.json')
      .then((mod) => mod.default as TagLabelEmbeddings)
      .catch((err: unknown) => {
        tagLabelEmbeddingsPromise = null
        throw err
      })
  }
  return tagLabelEmbeddingsPromise
}
