// Média normalizada de fotos de mulheres/meninas escolhidas pelo usuário
// (ver DIRETRIZES.md). Asset estático (1 vetor de 512 posições), carregado sob
// demanda e cacheado — mesmo padrão de loadTipoPrototypes.ts.
let promise: Promise<number[]> | null = null

export function loadPessoasPrototype(): Promise<number[]> {
  if (!promise) {
    promise = import('./pessoasPrototype.json')
      .then((mod) => (mod.default as { mulher: number[] }).mulher)
      .catch((err: unknown) => {
        promise = null
        throw err
      })
  }
  return promise
}
