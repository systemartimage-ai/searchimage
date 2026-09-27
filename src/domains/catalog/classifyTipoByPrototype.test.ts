import { describe, expect, it } from 'vitest'
import { classifyTipoByPrototype, type TipoPrototypes } from './classifyTipoByPrototype'

const prototypes: TipoPrototypes = {
  espelho: [1, 0],
  quadro: [0, 1],
}

describe('classifyTipoByPrototype', () => {
  it('classifica como espelho quando claramente mais parecido com o protótipo de espelho', () => {
    expect(classifyTipoByPrototype([0.95, 0.1], prototypes)).toBe('espelho')
  })

  it('classifica como quadro quando claramente mais parecido com o protótipo de quadro', () => {
    expect(classifyTipoByPrototype([0.1, 0.95], prototypes)).toBe('quadro')
  })

  it('retorna null quando a margem entre os dois é pequena demais (ambíguo)', () => {
    expect(classifyTipoByPrototype([0.71, 0.7], prototypes)).toBeNull()
  })

  it('retorna null pra vetor igualmente parecido com os dois', () => {
    expect(classifyTipoByPrototype([1, 1], prototypes)).toBeNull()
  })
})
