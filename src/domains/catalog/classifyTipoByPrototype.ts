export interface TipoPrototypes {
  espelho: number[]
  quadro: number[]
}

// Duplicada de tagClassifier.ts de propósito (não importada) — um
// import sem extensão entre dois arquivos .ts só resolve dentro do
// Vite; quebra quando este arquivo é carregado direto pelo Node
// (scripts/generateTags.mjs, via --experimental-strip-types). Função
// pequena e estável, risco de desalinhar é baixo.
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

/** Só classifica quando a diferença entre as duas comparações é clara — abaixo disso, fica sem tag em vez de arriscar errado. */
const MARGIN_THRESHOLD = 0.03

/**
 * Classifica "tipo" (espelho/quadro) comparando o embedding contra a
 * MÉDIA de exemplos reais confirmados visualmente (ver
 * scripts/generateTipoPrototypes.mjs), não contra um rótulo de texto
 * genérico — achado real: comparar com texto ("a mirror") tinha margem
 * de separação de só 0.01–0.03 (praticamente ruído) entre
 * quadro/espelho/escultura; comparar com a média de fotos reais
 * confirmadas separa muito melhor (margem de 0.05–0.12 na validação).
 * Retorna `null` quando a margem é pequena demais pra confiar — sem
 * tag é melhor que tag errada.
 */
export function classifyTipoByPrototype(
  embedding: number[],
  prototypes: TipoPrototypes,
): 'espelho' | 'quadro' | null {
  const mirrorSim = cosineSimilarity(embedding, prototypes.espelho)
  const paintingSim = cosineSimilarity(embedding, prototypes.quadro)
  const margin = Math.abs(mirrorSim - paintingSim)

  if (margin < MARGIN_THRESHOLD) return null
  return mirrorSim > paintingSim ? 'espelho' : 'quadro'
}

/** Categoria de origem no site-fonte que já identifica o item como espelho de verdade (página "Mirror"). */
export const MIRROR_SOURCE_CATEGORY = 'Espelhos'

/**
 * Resolve a tag de tipo com prioridade pro dado de origem: se o item veio
 * da categoria "Espelhos" do site-fonte (página Mirror, ver
 * MIRROR_SOURCE_CATEGORY), essa classificação é mais confiável que a visual
 * por protótipo — é a própria origem confirmando o tipo, não uma inferência.
 * Achado real: 29 dos 91 itens dessa categoria ficaram sem tag (margem do
 * classificador visual abaixo do limiar) e 1 ficou com a tag errada
 * ('quadro') — o dado de origem corrige os dois casos.
 */
export function resolveTipoTag(
  embedding: number[],
  prototypes: TipoPrototypes,
  sourceCategory: string | null | undefined,
): 'espelho' | 'quadro' | null {
  if (sourceCategory === MIRROR_SOURCE_CATEGORY) return 'espelho'
  return classifyTipoByPrototype(embedding, prototypes)
}
