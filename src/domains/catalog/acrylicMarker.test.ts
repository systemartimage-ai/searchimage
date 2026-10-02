import { describe, expect, it } from 'vitest'
import marker from './acrylicMarker.json'
import { ACRYLIC_MARKER_THRESHOLD, looksAcrylic, scoreAcrylic } from './acrylicMarker'

describe('scoreAcrylic', () => {
  it('é a logística de b + w·x', () => {
    expect(scoreAcrylic([1, 0], { w: [0, 0], b: 0 })).toBeCloseTo(0.5)
    expect(scoreAcrylic([1, 0], { w: [10, 0], b: -5 })).toBeCloseTo(1 / (1 + Math.exp(-5)))
  })

  it('dimensão diferente (marcador inválido) vira 0, sem lançar erro', () => {
    expect(scoreAcrylic([1, 0, 0], { w: [1, 1], b: 0 })).toBe(0)
  })

  it('looksAcrylic usa o corte 0,90', () => {
    expect(ACRYLIC_MARKER_THRESHOLD).toBe(0.9)
    expect(looksAcrylic([1, 0], { w: [10, 0], b: -5 })).toBe(true)
    expect(looksAcrylic([1, 0], { w: [1, 0], b: 0 })).toBe(false)
  })
})

describe('acrylicMarker.json', () => {
  it('tem 512 pesos finitos e viés', () => {
    expect(marker.w).toHaveLength(512)
    expect(marker.w.every(Number.isFinite)).toBe(true)
    expect(Number.isFinite(marker.b)).toBe(true)
  })

  it('o vetor nulo não vira acrílico', () => {
    expect(scoreAcrylic(new Array(512).fill(0), marker)).toBeLessThan(0.9)
  })
})
