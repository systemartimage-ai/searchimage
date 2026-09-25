import { describe, expect, it } from 'vitest'
import { hashString, mulberry32 } from './hash'

describe('hashString', () => {
  it('é determinístico', () => {
    expect(hashString('abc')).toBe(hashString('abc'))
  })

  it('produz valores diferentes para entradas diferentes', () => {
    expect(hashString('abc')).not.toBe(hashString('abd'))
  })
})

describe('mulberry32', () => {
  it('é determinístico para a mesma seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect(a()).toBe(b())
    expect(a()).toBe(b())
  })

  it('produz valores em [0, 1)', () => {
    const rand = mulberry32(1)
    for (let i = 0; i < 20; i++) {
      const v = rand()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})
