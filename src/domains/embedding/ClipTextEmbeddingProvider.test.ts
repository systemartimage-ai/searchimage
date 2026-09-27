import { describe, expect, it } from 'vitest'
import { looksPortuguese, stripDomainGlossaryWord } from './ClipTextEmbeddingProvider'

describe('looksPortuguese', () => {
  it('detecta português com acento', () => {
    expect(looksPortuguese('espelho orgânico')).toBe(true)
  })

  it('detecta português sem acento (achado real: "espelho organico" não batia antes)', () => {
    expect(looksPortuguese('espelho organico')).toBe(true)
    expect(looksPortuguese('Espelho Organico')).toBe(true)
  })

  it('detecta palavras do vocabulário do app mesmo sem stopword/acento', () => {
    expect(looksPortuguese('quadro azul')).toBe(true)
    expect(looksPortuguese('leao')).toBe(true)
    expect(looksPortuguese('quero um espelho redondo')).toBe(true)
  })

  it('não marca inglês como português', () => {
    expect(looksPortuguese('organic mirror')).toBe(false)
    expect(looksPortuguese('blue painting')).toBe(false)
    expect(looksPortuguese('lion painting')).toBe(false)
  })
})

describe('stripDomainGlossaryWord', () => {
  it('extrai "quadro" e devolve o resto da frase pra traduzir separado', () => {
    expect(stripDomainGlossaryWord('quadro azul')).toEqual({ englishWord: 'painting', rest: 'azul' })
  })

  it('extrai "quadros" (plural)', () => {
    expect(stripDomainGlossaryWord('quadros abstratos')).toEqual({
      englishWord: 'paintings',
      rest: 'abstratos',
    })
  })

  it('quando a frase é só a palavra, o resto fica vazio', () => {
    expect(stripDomainGlossaryWord('quadro')).toEqual({ englishWord: 'painting', rest: '' })
  })

  it('não mexe em frase sem a palavra do glossário', () => {
    expect(stripDomainGlossaryWord('espelho redondo')).toEqual({ englishWord: null, rest: 'espelho redondo' })
  })

  it('não confunde "quadro" dentro de outra palavra (limite de palavra)', () => {
    expect(stripDomainGlossaryWord('enquadramento')).toEqual({ englishWord: null, rest: 'enquadramento' })
  })
})
