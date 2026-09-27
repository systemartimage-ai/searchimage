/**
 * Taxonomia de tags estruturadas (tipo, tema, categoria/ambiente, cor,
 * animal, moldura, formato de espelho) — fonte única compartilhada
 * entre `scripts/generateTags.mjs` (que embeda o rótulo em inglês e
 * classifica contra o embedding já salvo de cada item) e a busca
 * híbrida no cliente (que precisa saber quais valores de tag existem
 * de verdade pra extrair palavras-chave da consulta do usuário).
 *
 * `requireBeatsBaseline`, quando definido, é um rótulo "nenhum/sem X"
 * que compete como baseline na classificação mas NUNCA vira uma tag
 * salva — por isso fica de fora de `ALL_TAG_VALUES`.
 */
export interface TagCategory {
  threshold: number
  topN: number
  requireBeatsBaseline?: string
  onlyIfHasTag?: string
  labels: Array<[pt: string, en: string]>
}

/**
 * "tipo" (quadro/espelho/escultura, classificação por rótulo de texto
 * genérico tipo "a mirror") e as tags derivadas dela (moldura, formato
 * de espelho) foram REMOVIDAS daqui — achado real: a margem de
 * separação entre quadro/espelho/escultura ficava em só 0.01–0.03
 * (praticamente ruído), e conferindo várias fotos manualmente a taxa
 * de erro foi alta demais pra confiar. "espelho"/"quadro" voltaram como
 * tag (ver ALL_TAG_VALUES abaixo), mas agora vêm de
 * classifyTipoByPrototype.ts — compara contra a MÉDIA de fotos reais
 * confirmadas visualmente, não contra uma frase em inglês. Margem bem
 * melhor (0.05–0.12) na validação. "escultura"/moldura/formato de
 * espelho continuam fora por enquanto (sem exemplos confirmados ainda).
 */
export const TAG_CATEGORIES: Record<string, TagCategory> = {
  tema: {
    threshold: 0.22,
    topN: 2,
    requireBeatsBaseline: 'nenhum',
    labels: [
      ['nenhum', 'generic decorative art with no specific theme'],
      ['floresta', 'forest theme'],
      ['praia', 'beach theme'],
      ['paisagem', 'landscape scenery'],
      ['abstrato', 'abstract art'],
      ['retrato', 'portrait'],
      ['natureza morta', 'still life'],
      ['urbano', 'urban city scene'],
      ['vida selvagem', 'wildlife photography'],
      ['preto e branco', 'black and white photography'],
      ['minimalista', 'minimalist design'],
      ['geometrico', 'geometric pattern'],
    ],
  },
  categoria: {
    threshold: 0.22,
    topN: 1,
    requireBeatsBaseline: 'nenhum',
    labels: [
      ['nenhum', 'generic decorative item with no specific room theme'],
      ['cozinha', 'kitchen themed art'],
      ['infantil', 'kids room art'],
      ['animais', 'animal themed art'],
      ['arquitetura', 'architecture photography'],
      ['contemporaneo', 'contemporary art'],
      ['fotografia', 'photography art'],
      ['rustico', 'rustic style'],
      ['natureza', 'nature themed art'],
      ['jardim', 'garden themed art'],
      ['carros', 'cars themed art'],
      ['cidades', 'cityscape art'],
    ],
  },
  cor: {
    threshold: 0.2,
    topN: 1,
    labels: [
      ['tons de azul', 'predominantly blue tones'],
      ['tons quentes', 'warm earthy tones'],
      ['preto e branco', 'black and white'],
      ['colorido', 'colorful and vibrant'],
      ['tons neutros', 'neutral beige tones'],
      ['tons verdes', 'green tones'],
      ['dourado', 'gold or metallic tones'],
    ],
  },
  animal: {
    threshold: 0.24,
    topN: 1,
    requireBeatsBaseline: 'sem animal',
    labels: [
      ['sem animal', 'no animal, not a photo of an animal'],
      ['leao', 'a lion'],
      ['tigre', 'a tiger'],
      ['girafa', 'a giraffe'],
      ['zebra', 'a zebra'],
      ['elefante', 'an elephant'],
      ['passaro', 'a bird'],
      ['cavalo', 'a horse'],
      ['cachorro', 'a dog'],
      ['gato', 'a cat'],
      ['peixe', 'a fish'],
    ],
  },
}

/** "tipo" classificado por protótipo (classifyTipoByPrototype.ts), não por rótulo de texto — ver comentário de TAG_CATEGORIES acima. */
export const TIPO_TAG_VALUES = ['espelho', 'quadro'] as const

/** Todo valor de tag que pode realmente ser salvo (exclui os rótulos-baseline "nenhum"/"sem X"). */
export const ALL_TAG_VALUES: string[] = Array.from(
  new Set([
    ...TIPO_TAG_VALUES,
    ...Object.values(TAG_CATEGORIES).flatMap((cat) =>
      cat.labels.map(([pt]) => pt).filter((pt) => pt !== cat.requireBeatsBaseline),
    ),
  ]),
).sort((a, b) => b.length - a.length) // mais específico (mais longo) primeiro, ex. "espelho redondo" antes de "espelho"
