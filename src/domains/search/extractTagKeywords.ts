import { ALL_TAG_VALUES } from '@/domains/catalog/tagTaxonomy'

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Formas alternativas de uma palavra normalizada — plural regular
 * (troca "s" final), e o plural irregular mais comum do português pra
 * palavras terminadas em "-ão" (leão/leões, ação/ações etc., "ão"
 * normalizado vira "ao", plural "ões" normalizado vira "oes"). Não é
 * um analisador morfológico completo, só cobre os casos reais dos
 * animais/temas da taxonomia (ver tagTaxonomy.ts).
 */
function wordVariants(word: string): string[] {
  const variants = new Set([word])
  if (word.endsWith('s')) variants.add(word.slice(0, -1))
  if (word.endsWith('oes')) variants.add(word.slice(0, -3) + 'ao')
  return Array.from(variants)
}

/** Distância de Levenshtein — pra tolerar pequenos erros de digitação. */
function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[a.length][b.length]
}

/** Quantos erros de digitação tolerar, proporcional ao tamanho da palavra (evita falso positivo em palavra curta). */
function maxAllowedDistance(wordLength: number): number {
  if (wordLength <= 4) return 0
  if (wordLength <= 8) return 1
  return 2
}

/**
 * Acha quais tags conhecidas (ver tagTaxonomy.ts) a consulta do
 * usuário provavelmente quis dizer — "entende como uma IA entende":
 * ignora acento/caixa, reconhece plural/singular ("leão", "leões",
 * "leao" todos viram a tag `leao`) e tolera pequenos erros de
 * digitação (distância de Levenshtein), sempre convertendo pra
 * palavra exata salva no banco. `ALL_TAG_VALUES` já vem do mais
 * específico pro mais genérico, então "espelho redondo" não também
 * ativa a tag solta "espelho".
 */
export function extractTagKeywords(query: string): string[] {
  const queryWords = normalize(query)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
  const found: string[] = []

  for (const tag of ALL_TAG_VALUES) {
    if (found.some((f) => f.includes(tag) || tag.includes(f))) continue

    const tagWords = tag.split(' ')
    const matchesTag = tagWords.every((tagWord) =>
      queryWords.some((queryWord) => {
        const queryVariants = wordVariants(queryWord)
        if (queryVariants.includes(tagWord)) return true
        return queryVariants.some(
          (v) => levenshtein(v, tagWord) <= maxAllowedDistance(tagWord.length),
        )
      }),
    )

    if (matchesTag) found.push(tag)
  }

  return found
}
