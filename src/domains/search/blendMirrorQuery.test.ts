import { describe, expect, it } from 'vitest'
import { blendWithMirrorPrototype } from './blendMirrorQuery'

describe('blendWithMirrorPrototype', () => {
  it('soma texto e protótipo e devolve vetor unitário', () => {
    const v = blendWithMirrorPrototype([1, 0], [0, 1])
    expect(v[0]).toBeCloseTo(Math.SQRT1_2)
    expect(v[1]).toBeCloseTo(Math.SQRT1_2)
    expect(Math.hypot(...v)).toBeCloseTo(1)
  })

  it('mantém o vetor de texto se o protótipo é inválido', () => {
    expect(blendWithMirrorPrototype([1, 0], [])).toEqual([1, 0])
    expect(blendWithMirrorPrototype([1, 0], undefined as unknown as number[])).toEqual([1, 0])
  })
})
