import { describe, expect, it } from 'vitest'
import { MOCK_CATALOG } from '@/domains/catalog/mockCatalogData'
import { searchMockCatalog } from './searchMockCatalog'

describe('searchMockCatalog', () => {
  it('coloca em primeiro o item idêntico ao vetor de consulta', () => {
    const target = MOCK_CATALOG[5]
    const results = searchMockCatalog(target.embedding, { limit: 10 })

    expect(results[0].item.id).toBe(target.id)
    expect(results[0].score).toBeCloseTo(1)
  })

  it('respeita o limite de resultados', () => {
    const results = searchMockCatalog(MOCK_CATALOG[0].embedding, { limit: 3 })
    expect(results).toHaveLength(3)
  })

  it('filtra por categoria', () => {
    const category = MOCK_CATALOG[0].category
    const results = searchMockCatalog(MOCK_CATALOG[0].embedding, { limit: 100, category })
    expect(results.every((r) => r.item.category === category)).toBe(true)
  })

  it('filtra por código (case-insensitive, substring)', () => {
    const results = searchMockCatalog(MOCK_CATALOG[0].embedding, {
      limit: 100,
      code: 'mock-000',
    })
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((r) => r.item.code.toLowerCase().includes('mock-000'))).toBe(true)
  })

  it('aplica threshold mínimo de similaridade', () => {
    const results = searchMockCatalog(MOCK_CATALOG[0].embedding, { limit: 100, threshold: 1.01 })
    expect(results).toHaveLength(0)
  })

  it('resultado vazio quando filtro de categoria não bate com nenhum item', () => {
    const results = searchMockCatalog(MOCK_CATALOG[0].embedding, {
      limit: 10,
      category: 'categoria-inexistente',
    })
    expect(results).toHaveLength(0)
  })
})
