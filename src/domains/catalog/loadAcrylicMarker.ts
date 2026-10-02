import type { AcrylicMarker } from './acrylicMarker'

// Asset estático (512 pesos + viés), carregado sob demanda e cacheado — mesmo
// padrão de loadTipoPrototypes.ts (cache da Promise rejeitada é limpo no erro).
let promise: Promise<AcrylicMarker> | null = null

export function loadAcrylicMarker(): Promise<AcrylicMarker> {
  if (!promise) {
    promise = import('./acrylicMarker.json')
      .then((mod) => mod.default as AcrylicMarker)
      .catch((err: unknown) => {
        promise = null
        throw err
      })
  }
  return promise
}
