import type { TipoPrototypes } from './classifyTipoByPrototype'

// Asset estático pequeno (2 vetores de 512 posições) — carregado sob
// demanda e cacheado no módulo, mesmo padrão de loadTagLabelEmbeddings.ts.
let tipoPrototypesPromise: Promise<TipoPrototypes> | null = null

export function loadTipoPrototypes(): Promise<TipoPrototypes> {
  if (!tipoPrototypesPromise) {
    // Achado real (mesmo padrão de ClipEmbeddingProvider.ts): cache de
    // Promise REJEITADA travaria a busca pra sempre depois de uma falha
    // pontual de carregamento do chunk — limpa o cache no erro.
    tipoPrototypesPromise = import('./tipoPrototypes.json')
      .then((mod) => mod.default as TipoPrototypes)
      .catch((err: unknown) => {
        tipoPrototypesPromise = null
        throw err
      })
  }
  return tipoPrototypesPromise
}
