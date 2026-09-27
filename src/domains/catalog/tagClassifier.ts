import type { TagCategory } from './tagTaxonomy'

/** Embeddings dos rótulos (em inglês) de cada categoria, na MESMA ordem de `TagCategory.labels`. */
export type TagLabelEmbeddings = Record<string, number[][]>

export function cosineSimilarity(a: number[], b: number[]): number {
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

/**
 * Classifica um embedding (de item do catálogo OU de imagem de busca —
 * mesmo espaço vetorial CLIP) contra os rótulos de uma categoria.
 * Mesma lógica usada em `scripts/generateTags.mjs` pra gerar as tags
 * salvas no catálogo: rótulo baseline ("nenhum"/"sem X") compete e
 * precisa ser batido, senão qualquer classificação em categoria aberta
 * sempre escolhe "a menos ruim" mesmo quando nenhuma se aplica.
 */
export function classifyCategory(
  embedding: number[],
  categoryDef: TagCategory,
  labelEmbeddings: number[][],
): string[] {
  const scored = categoryDef.labels.map(([ptTag], i) => ({
    ptTag,
    score: cosineSimilarity(embedding, labelEmbeddings[i]),
  }))
  scored.sort((a, b) => b.score - a.score)

  const baselineScore = categoryDef.requireBeatsBaseline
    ? (scored.find((s) => s.ptTag === categoryDef.requireBeatsBaseline)?.score ?? -1)
    : -1

  return scored
    .filter(
      (s) =>
        s.score >= categoryDef.threshold &&
        s.ptTag !== categoryDef.requireBeatsBaseline &&
        s.score > baselineScore,
    )
    .slice(0, categoryDef.topN)
    .map((s) => s.ptTag)
}

/**
 * Classifica um embedding contra várias categorias da taxonomia (por
 * padrão todas — `categoryNames` restringe a um subconjunto, preservando
 * a ordem de `categories` pra `onlyIfHasTag` funcionar corretamente).
 */
export function classifyTags(
  embedding: number[],
  categories: Record<string, TagCategory>,
  labelEmbeddingsByCategory: TagLabelEmbeddings,
  categoryNames?: string[],
): string[] {
  const names = categoryNames ?? Object.keys(categories)
  const tags: string[] = []
  for (const name of names) {
    const catDef = categories[name]
    if (!catDef) continue
    if (catDef.onlyIfHasTag && !tags.includes(catDef.onlyIfHasTag)) continue
    tags.push(...classifyCategory(embedding, catDef, labelEmbeddingsByCategory[name]))
  }
  return tags
}
