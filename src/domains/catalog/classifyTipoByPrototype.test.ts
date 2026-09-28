import { describe, expect, it } from 'vitest'
import { classifyTipoByPrototype, resolveTipoTag, type TipoPrototypes } from './classifyTipoByPrototype'

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

// resolveTipoTag: achado real (categoria "Espelhos" do site-fonte, página
// Mirror) — 29 de 91 itens dessa categoria ficavam sem tag e 1 com a tag
// errada 'quadro', porque a classificação visual sozinha erra margem em
// casos limítrofes. O dado de origem (mais confiável que inferência visual)
// tem prioridade.
describe('resolveTipoTag', () => {
  it('força "espelho" quando a categoria de origem é "Espelhos", mesmo com embedding ambíguo', () => {
    expect(resolveTipoTag([0.71, 0.7], prototypes, 'Espelhos')).toBe('espelho')
  })

  it('força "espelho" quando a categoria de origem é "Espelhos", mesmo com embedding parecendo quadro', () => {
    expect(resolveTipoTag([0.1, 0.95], prototypes, 'Espelhos')).toBe('espelho')
  })

  it('cai na classificação visual normal quando a categoria não é "Espelhos"', () => {
    expect(resolveTipoTag([0.1, 0.95], prototypes, 'Quadros')).toBe('quadro')
    expect(resolveTipoTag([0.71, 0.7], prototypes, 'Quadros')).toBeNull()
  })

  it('cai na classificação visual normal quando não há categoria', () => {
    expect(resolveTipoTag([0.95, 0.1], prototypes, null)).toBe('espelho')
    expect(resolveTipoTag([0.95, 0.1], prototypes, undefined)).toBe('espelho')
  })
})
