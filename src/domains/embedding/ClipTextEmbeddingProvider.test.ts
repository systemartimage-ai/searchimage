import { describe, expect, it, vi } from 'vitest'
import { pipeline, AutoTokenizer, CLIPTextModelWithProjection } from '@huggingface/transformers'
import { looksPortuguese, stripDomainGlossaryWord, ClipTextEmbeddingProvider } from './ClipTextEmbeddingProvider'

vi.mock('@huggingface/transformers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@huggingface/transformers')>()
  return {
    ...actual,
    pipeline: vi.fn(),
    AutoTokenizer: { from_pretrained: vi.fn() },
    CLIPTextModelWithProjection: { from_pretrained: vi.fn() },
  }
})

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

// Achado real: se o carregamento de um modelo (tradutor/tokenizer/CLIP de
// texto) falhar uma vez (ex. rede instável), a Promise REJEITADA ficava em
// cache pra sempre — toda busca por texto seguinte falhava na hora, sem
// tentar carregar de novo, e só um F5 resolvia (usuário clicava em
// "Buscar" de novo e nada acontecia). Acessa os métodos privados de
// carregamento direto só pra validar isoladamente que o cache se recupera.
describe('cache de carregamento do modelo se recupera depois de uma falha', () => {
  function privateLoaders(provider: ClipTextEmbeddingProvider) {
    return provider as unknown as {
      getTranslator: () => Promise<unknown>
      getTokenizer: () => Promise<unknown>
      getTextModel: () => Promise<unknown>
    }
  }

  it('getTranslator tenta carregar de novo depois de uma falha', async () => {
    const mockPipeline = vi.mocked(pipeline)
    mockPipeline.mockRejectedValueOnce(new Error('falha de rede')).mockResolvedValueOnce({ ok: true } as never)

    const loaders = privateLoaders(new ClipTextEmbeddingProvider())
    await expect(loaders.getTranslator()).rejects.toThrow('falha de rede')
    await expect(loaders.getTranslator()).resolves.toEqual({ ok: true })
    expect(mockPipeline).toHaveBeenCalledTimes(2)
  })

  it('getTokenizer tenta carregar de novo depois de uma falha', async () => {
    const mockFromPretrained = vi.mocked(AutoTokenizer.from_pretrained)
    mockFromPretrained
      .mockRejectedValueOnce(new Error('falha de rede'))
      .mockResolvedValueOnce({ ok: true } as never)

    const loaders = privateLoaders(new ClipTextEmbeddingProvider())
    await expect(loaders.getTokenizer()).rejects.toThrow('falha de rede')
    await expect(loaders.getTokenizer()).resolves.toEqual({ ok: true })
    expect(mockFromPretrained).toHaveBeenCalledTimes(2)
  })

  it('getTextModel tenta carregar de novo depois de uma falha', async () => {
    const mockFromPretrained = vi.mocked(CLIPTextModelWithProjection.from_pretrained)
    mockFromPretrained
      .mockRejectedValueOnce(new Error('falha de rede'))
      .mockResolvedValueOnce({ ok: true } as never)

    const loaders = privateLoaders(new ClipTextEmbeddingProvider())
    await expect(loaders.getTextModel()).rejects.toThrow('falha de rede')
    await expect(loaders.getTextModel()).resolves.toEqual({ ok: true })
    expect(mockFromPretrained).toHaveBeenCalledTimes(2)
  })
})
