import { hashString, mulberry32 } from '@/lib/hash'
import { FAKE_EMBEDDING_DIMENSION } from '@/domains/embedding'
import type { CatalogItem } from './types'

/**
 * Catálogo de teste da Fase 2 (06_PLANO_IMPLEMENTACAO_CLAUDE_CODE.md:
 * "Antes da IA real: popular catálogo de teste"). Itens e imagens são
 * 100% fictícios — não representam o catálogo real da Artimage, que só
 * existirá depois da Fase 5 (indexador real). Os códigos usam o
 * prefixo "MOCK-" de propósito para nunca serem confundidos com SKUs
 * reais.
 *
 * As "imagens" são SVGs gerados localmente (sem rede) e os
 * "embeddings" são vetores pseudo-aleatórios determinísticos — servem
 * só para exercitar o pipeline UI → EmbeddingProvider → ranking por
 * similaridade, não para representar semelhança visual real.
 */

const CATEGORIES = ['Quadros', 'Colecionáveis', 'Espelhos', 'Diversos'] as const

const PALETTES: Array<[string, string]> = [
  ['#f97316', '#fb923c'],
  ['#8b5cf6', '#a78bfa'],
  ['#0ea5e9', '#38bdf8'],
  ['#10b981', '#34d399'],
  ['#ec4899', '#f472b6'],
  ['#f59e0b', '#fbbf24'],
]

function svgPlaceholder(id: string, label: string): string {
  const seed = hashString(id)
  const [from, to] = PALETTES[seed % PALETTES.length]
  const shape = seed % 3

  const shapeMarkup =
    shape === 0
      ? `<circle cx="200" cy="200" r="90" fill="white" fill-opacity="0.18" />`
      : shape === 1
        ? `<rect x="110" y="110" width="180" height="180" rx="18" fill="white" fill-opacity="0.18" />`
        : `<polygon points="200,90 310,290 90,290" fill="white" fill-opacity="0.18" />`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${from}" />
        <stop offset="1" stop-color="${to}" />
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#g)" />
    ${shapeMarkup}
    <text x="200" y="370" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" fill="white" fill-opacity="0.9">${label}</text>
  </svg>`

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

function mockEmbedding(id: string): number[] {
  const rand = mulberry32(hashString(id))
  const vector = Array.from({ length: FAKE_EMBEDDING_DIMENSION }, () => rand() * 2 - 1)
  const norm = Math.hypot(...vector) || 1
  return vector.map((v) => v / norm)
}

const TITLES = [
  'Vertical',
  'Horizonte',
  'Composição em azul',
  'Retrato abstrato',
  'Linhas cruzadas',
  'Textura orgânica',
  'Reflexo',
  'Fragmento urbano',
  'Camadas',
  'Silêncio',
  'Contraste',
  'Deriva',
]

function buildMockCatalog(count: number): CatalogItem[] {
  return Array.from({ length: count }, (_, i) => {
    const id = `mock-${i + 1}`
    const code = `MOCK-${String(i + 1).padStart(4, '0')}`
    const category = CATEGORIES[i % CATEGORIES.length]
    const title = `${TITLES[i % TITLES.length]} ${Math.floor(i / TITLES.length) + 1}`

    return {
      id,
      title,
      code,
      category,
      source: 'Catálogo Indexado (mock)',
      thumbnailUrl: svgPlaceholder(id, code),
      embedding: mockEmbedding(id),
    }
  })
}

export const MOCK_CATALOG: CatalogItem[] = buildMockCatalog(32)

export const MOCK_CATALOG_LAST_UPDATED = '2026-09-25T00:00:00.000Z'
