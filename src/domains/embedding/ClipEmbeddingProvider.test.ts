import { describe, expect, it, vi } from 'vitest'
import { pipeline } from '@huggingface/transformers'
import { computeCropBox, ClipEmbeddingProvider } from './ClipEmbeddingProvider'

vi.mock('@huggingface/transformers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@huggingface/transformers')>()
  return { ...actual, pipeline: vi.fn() }
})

// Achado real: a maioria das fotos do catálogo é ambientada (sofá, parede,
// piso), e o CLIP embeda a cena inteira — computeCropBox isola a lógica
// (testável sem baixar nenhum modelo) que decide a região da peça a
// recortar antes de embedar, ver ClipEmbeddingProvider.ts.
describe('computeCropBox', () => {
  it('sem detecção nenhuma, não recorta (retorna null)', () => {
    expect(computeCropBox([], 800, 600)).toBeNull()
  })

  it('detecção abaixo do limiar é ignorada, não recorta', () => {
    const detections = [{ score: 0.05, box: { xmin: 100, ymin: 100, xmax: 200, ymax: 200 } }]
    expect(computeCropBox(detections, 800, 600)).toBeNull()
  })

  it('uma detecção confiável gera caixa com margem, limitada às bordas da imagem', () => {
    const detections = [{ score: 0.5, box: { xmin: 100, ymin: 100, xmax: 300, ymax: 300 } }]
    const box = computeCropBox(detections, 800, 600)
    expect(box).not.toBeNull()
    const [xmin, ymin, xmax, ymax] = box!
    // margem de 6% da largura/altura da caixa (200px) = 12px de cada lado
    expect(xmin).toBe(88)
    expect(ymin).toBe(88)
    expect(xmax).toBe(312)
    expect(ymax).toBe(312)
  })

  it('duas detecções confiáveis geram a caixa UNIÃO das duas (composição de mais de uma peça)', () => {
    const detections = [
      { score: 0.5, box: { xmin: 50, ymin: 50, xmax: 150, ymax: 150 } },
      { score: 0.4, box: { xmin: 400, ymin: 60, xmax: 500, ymax: 160 } },
    ]
    const box = computeCropBox(detections, 800, 600)
    expect(box).not.toBeNull()
    const [xmin, ymin, xmax, ymax] = box!
    // união bruta seria [50,50,500,160] + margem de 6% de (450x110)
    expect(xmin).toBeLessThan(50)
    expect(ymin).toBeLessThan(50)
    expect(xmax).toBeGreaterThan(500)
    expect(ymax).toBeGreaterThan(160)
  })

  it('nunca extrapola as bordas da imagem mesmo com margem', () => {
    const detections = [{ score: 0.9, box: { xmin: 0, ymin: 0, xmax: 800, ymax: 600 } }]
    const box = computeCropBox(detections, 800, 600)
    expect(box).toEqual([0, 0, 800, 600])
  })
})

// Achado real: se o carregamento do modelo (pipeline()) falhar uma vez
// (ex. rede instável), a Promise REJEITADA ficava em cache pra sempre —
// toda busca seguinte falhava na hora, sem tentar carregar de novo, e só
// um F5 resolvia. Acessa os métodos privados de carregamento direto (sem
// mockar RawImage/decodificação de imagem inteira) só pra validar
// isoladamente que o cache se recupera depois de um erro.
describe('cache de carregamento do modelo se recupera depois de uma falha', () => {
  function privateLoaders(provider: ClipEmbeddingProvider) {
    return provider as unknown as {
      getExtractor: () => Promise<unknown>
      getDetector: () => Promise<unknown>
    }
  }

  it('getExtractor tenta carregar de novo depois de uma falha, não repete a mesma rejeição pra sempre', async () => {
    const mockPipeline = vi.mocked(pipeline)
    mockPipeline
      .mockRejectedValueOnce(new Error('falha de rede'))
      .mockResolvedValueOnce({ ok: true } as never)

    const provider = new ClipEmbeddingProvider()
    const loaders = privateLoaders(provider)

    await expect(loaders.getExtractor()).rejects.toThrow('falha de rede')
    await expect(loaders.getExtractor()).resolves.toEqual({ ok: true })
    expect(mockPipeline).toHaveBeenCalledTimes(2)
  })

  it('getDetector tenta carregar de novo depois de uma falha', async () => {
    const mockPipeline = vi.mocked(pipeline)
    mockPipeline
      .mockRejectedValueOnce(new Error('falha de rede'))
      .mockResolvedValueOnce({ ok: true } as never)

    const provider = new ClipEmbeddingProvider()
    const loaders = privateLoaders(provider)

    await expect(loaders.getDetector()).rejects.toThrow('falha de rede')
    await expect(loaders.getDetector()).resolves.toEqual({ ok: true })
    expect(mockPipeline).toHaveBeenCalledTimes(2)
  })
})

describe('detector incompatível', () => {
  it('usa a imagem inteira sem carregar de novo um operador incompatível a cada imagem', async () => {
    vi.mocked(pipeline)
      .mockReset()
      .mockRejectedValue(
        new Error("Could not find an implementation for Cast(13) node '/class_head/Cast'"),
      )
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const provider = new ClipEmbeddingProvider() as unknown as {
      cropToArtwork: (raw: object) => Promise<object>
    }
    const first = { width: 224, height: 224 }
    const second = { width: 300, height: 300 }
    await expect(provider.cropToArtwork(first)).resolves.toBe(first)
    await expect(provider.cropToArtwork(second)).resolves.toBe(second)
    expect(pipeline).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })
})
