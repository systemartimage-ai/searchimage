import type { TipoPrototypes } from './classifyTipoByPrototype'

// Asset estático pequeno (2 vetores de 512 posições) — carregado sob
// demanda e cacheado no módulo, mesmo padrão de loadTagLabelEmbeddings.ts.
let tipoPrototypesPromise: Promise<TipoPrototypes> | null = null

export function loadTipoPrototypes(): Promise<TipoPrototypes> {
  if (!tipoPrototypesPromise) {
    tipoPrototypesPromise = import('./tipoPrototypes.json').then((mod) => mod.default as TipoPrototypes)
  }
  return tipoPrototypesPromise
}
