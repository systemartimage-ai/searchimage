import { describe, expect, it } from 'vitest'
import { cosineSimilarity } from './similarity'

describe('cosineSimilarity', () => {
  it('retorna 1 para vetores idênticos', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1)
  })

  it('retorna -1 para vetores opostos', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1)
  })

  it('retorna 0 para vetores ortogonais', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0)
  })

  it('retorna 0 quando algum vetor é nulo', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0)
  })

  it('lança erro para dimensões diferentes', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow()
  })
})
