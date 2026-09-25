import { describe, expect, it } from 'vitest'
import { FakeEmbeddingProvider } from './FakeEmbeddingProvider'

describe('FakeEmbeddingProvider', () => {
  it('gera vetor com a dimensão configurada', async () => {
    const provider = new FakeEmbeddingProvider(8)
    const image = new Blob([new Uint8Array([1, 2, 3, 4, 5])])

    const vector = await provider.embedImage(image)

    expect(vector).toHaveLength(8)
  })

  it('é determinístico para a mesma imagem', async () => {
    const provider = new FakeEmbeddingProvider()
    const image = new Blob([new Uint8Array([10, 20, 30])])

    const a = await provider.embedImage(image)
    const b = await provider.embedImage(image)

    expect(a).toEqual(b)
  })

  it('embedBatch processa múltiplas imagens preservando a ordem', async () => {
    const provider = new FakeEmbeddingProvider()
    const img1 = new Blob([new Uint8Array([1])])
    const img2 = new Blob([new Uint8Array([2])])

    const [v1, v2] = await provider.embedBatch([img1, img2])
    const [expected1, expected2] = await Promise.all([
      provider.embedImage(img1),
      provider.embedImage(img2),
    ])

    expect(v1).toEqual(expected1)
    expect(v2).toEqual(expected2)
  })
})
