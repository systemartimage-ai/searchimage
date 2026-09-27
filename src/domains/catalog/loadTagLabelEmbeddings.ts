import type { TagLabelEmbeddings } from './tagClassifier'

// Asset estático (~250KB) com os embeddings dos rótulos da taxonomia —
// carregado sob demanda (dynamic import, vira chunk separado) e
// cacheado no módulo, já que não muda entre chamadas na mesma sessão.
// Usado tanto na busca por imagem (useImageSearch.ts) quanto no upload
// em massa de admin (classificação completa de tags no upload).
let tagLabelEmbeddingsPromise: Promise<TagLabelEmbeddings> | null = null

export function loadTagLabelEmbeddings(): Promise<TagLabelEmbeddings> {
  if (!tagLabelEmbeddingsPromise) {
    tagLabelEmbeddingsPromise = import('./tagLabelEmbeddings.json').then(
      (mod) => mod.default as TagLabelEmbeddings,
    )
  }
  return tagLabelEmbeddingsPromise
}
