/**
 * Busca por texto de "espelho": o CLIP entende mal a palavra "mirror"
 * contra fotos de produto (achado real: dos 35 primeiros resultados só 4
 * eram espelhos). A média de fotos reais de espelho confirmadas
 * (tipoPrototypes.json) vive no mesmo espaço dos vetores das imagens e
 * separa muito melhor. Somamos os dois vetores normalizados: o texto
 * digitado ("redondo", "dourado") continua influenciando o resultado.
 * Medido no catálogo real (49 mil itens): protótipo + texto trouxe
 * quase só espelhos, do site e do Upload Admin.
 */
export function blendWithMirrorPrototype(textEmbedding: number[], mirrorPrototype: number[]): number[] {
  if (!mirrorPrototype || mirrorPrototype.length !== textEmbedding.length) return textEmbedding
  const norm = (v: number[]) => Math.hypot(...v) || 1
  const nt = norm(textEmbedding)
  const np = norm(mirrorPrototype)
  const sum = textEmbedding.map((x, i) => x / nt + mirrorPrototype[i] / np)
  const ns = norm(sum)
  return sum.map((x) => x / ns)
}
