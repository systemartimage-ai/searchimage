import { describe, expect, it } from 'vitest'
import { extractTagKeywords } from './extractTagKeywords'

describe('extractTagKeywords', () => {
  it('reconhece a tag em português diretamente', () => {
    expect(extractTagKeywords('quero um espelho redondo')).toContain('espelho')
  })

  it('reconhece "mirror" em inglês como sinônimo de "espelho"', () => {
    expect(extractTagKeywords('a round mirror for the wall')).toContain('espelho')
  })

  it('reconhece o plural "mirrors" em inglês também', () => {
    expect(extractTagKeywords('vintage mirrors')).toContain('espelho')
  })

  it('não gera falso positivo pra texto sem relação nenhuma', () => {
    expect(extractTagKeywords('paisagem azul com montanhas')).not.toContain('espelho')
  })
})
