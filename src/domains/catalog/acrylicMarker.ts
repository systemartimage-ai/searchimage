/**
 * Marcador visual de acrílico: regressão logística sobre o embedding CLIP
 * (512), treinada por scripts/trainAcrylicMarker.mjs com a tag `acrilico`
 * (regra objetiva — acrylicRule.ts) como rótulo.
 *
 * Avaliação em produtos que o modelo não viu (15.328 itens, 1.559 acrílicos):
 * AUC 0,95; no corte 0,90, reconhece ~68% dos acrílicos e ~71% do que marca
 * é acrílico segundo a regra (conservador: acrílicos sem AC no código contam
 * como erro). Por isso serve só como SINAL DE PRIORIDADE (acrílicos primeiro,
 * depois os mais parecidos), nunca como filtro rígido.
 */
export interface AcrylicMarker {
  w: number[]
  b: number
}

export const ACRYLIC_MARKER_THRESHOLD = 0.9

/** Probabilidade (0 a 1) de a imagem ser de um acrílico. */
export function scoreAcrylic(embedding: number[], marker: AcrylicMarker): number {
  if (!marker?.w || marker.w.length !== embedding.length) return 0
  let z = marker.b
  for (let i = 0; i < embedding.length; i++) z += marker.w[i] * embedding[i]
  return 1 / (1 + Math.exp(-z))
}

export function looksAcrylic(embedding: number[], marker: AcrylicMarker): boolean {
  return scoreAcrylic(embedding, marker) >= ACRYLIC_MARKER_THRESHOLD
}
