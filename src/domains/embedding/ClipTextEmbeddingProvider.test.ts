import { describe, expect, it, vi } from 'vitest'
import { pipeline, AutoTokenizer, CLIPTextModelWithProjection } from '@huggingface/transformers'
import {
  looksPortuguese,
  normalizeQueryText,
  stripDomainGlossaryWord,
  withPersonPrompt,
  ClipTextEmbeddingProvider,
} from './ClipTextEmbeddingProvider'

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

// Achado real: "CEU AZUL" era traduzido como "THE SILVER" (o tradutor
// diferencia caixa) e a busca devolvia imagens prateadas.
describe('busca por texto em caixa alta', () => {
  it('normalizeQueryText remove caixa alta e espaços extras', () => {
    expect(normalizeQueryText('  CEU   AZUL ')).toBe('ceu azul')
  })

  it('embedText envia ao tradutor o texto em minúsculas', async () => {
    const translator = vi.fn().mockResolvedValue([{ translation_text: 'blue sky' }])
    vi.mocked(pipeline).mockResolvedValue(translator as never)
    const tokenizer = vi.fn().mockReturnValue({})
    vi.mocked(AutoTokenizer.from_pretrained).mockResolvedValue(tokenizer as never)
    const textModel = vi.fn().mockResolvedValue({ text_embeds: { data: new Float32Array([3, 4]) } })
    vi.mocked(CLIPTextModelWithProjection.from_pretrained).mockResolvedValue(textModel as never)

    const vector = await new ClipTextEmbeddingProvider().embedText('CEU AZUL')

    expect(translator).toHaveBeenCalledWith('ceu azul')
    expect(tokenizer).toHaveBeenCalledWith(['blue sky'], expect.anything())
    expect(vector[0]).toBeCloseTo(0.6)
    expect(vector[1]).toBeCloseTo(0.8)
  })
})

describe('withPersonPrompt', () => {
  it('prefixa buscas por menina/mulher com "a portrait of"', () => {
    expect(withPersonPrompt('menina e mulher', 'girl and woman')).toBe('a portrait of girl and woman')
    expect(withPersonPrompt('Mulheres', 'women')).toBe('a portrait of women')
  })

  it('não altera as demais buscas', () => {
    expect(withPersonPrompt('céu azul', 'blue sky')).toBe('blue sky')
    expect(withPersonPrompt('espelho', 'mirror')).toBe('mirror')
    expect(withPersonPrompt('mulheres', 'x')).not.toBe('x')
  })
})
