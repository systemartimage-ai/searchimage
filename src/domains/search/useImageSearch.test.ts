import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useImageSearch } from './useImageSearch'

const mocks = vi.hoisted(() => ({ image: vi.fn(), text: vi.fn(), search: vi.fn() }))
afterEach(() => vi.restoreAllMocks())
vi.mock('@/domains/embedding', () => ({
  ClipEmbeddingProvider: class {
    embedImage = mocks.image
  },
  ClipTextEmbeddingProvider: class {
    embedText = mocks.text
  },
}))
vi.mock('./searchCatalog', () => ({ searchCatalog: mocks.search }))
vi.mock('@/domains/catalog/loadTagLabelEmbeddings', () => ({
  loadTagLabelEmbeddings: async () => ({}),
}))
vi.mock('@/domains/catalog/loadTipoPrototypes', () => ({ loadTipoPrototypes: async () => ({}) }))
vi.mock('@/domains/catalog/tagClassifier', () => ({ classifyTags: () => [] }))
vi.mock('@/domains/catalog/classifyTipoByPrototype', () => ({
  classifyTipoByPrototype: () => null,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.image.mockReset().mockResolvedValue([1, 0])
  mocks.text.mockReset().mockResolvedValue([1, 0])
  mocks.search.mockReset().mockResolvedValue([])
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('busca — reaproveitamento do processamento e recuperação', () => {
  it('repete apenas a consulta ao banco após falha de rede, sem reprocessar imagem', async () => {
    mocks.search.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce([])
    const { result } = renderHook(() => useImageSearch())
    act(() => result.current.selectFile(new File(['image'], 'foto.png', { type: 'image/png' })))
    await act(() => result.current.runSearch({ limit: 100 }))
    expect(mocks.image).toHaveBeenCalledTimes(1)
    expect(mocks.search).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe('empty')
  })

  it('não triplica um timeout e reaproveita o texto processado na tentativa manual', async () => {
    mocks.search.mockRejectedValueOnce({ code: '57014', message: 'statement timeout' })
    const { result } = renderHook(() => useImageSearch())
    await act(() => result.current.runTextSearch('quadro azul', { limit: 100 }))
    expect(mocks.search).toHaveBeenCalledTimes(1)
    expect(result.current.errorMessage).toMatch(/catálogo demorou/i)
    await act(() => result.current.runTextSearch('quadro azul', { limit: 100 }))
    expect(mocks.text).toHaveBeenCalledTimes(1)
    expect(mocks.search).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe('empty')
    expect(result.current.errorMessage).toBeNull()
  })

  it('processa novamente quando o texto muda ou a busca é limpa', async () => {
    const { result } = renderHook(() => useImageSearch())
    await act(() => result.current.runTextSearch('quadro azul', { limit: 100 }))
    await act(() => result.current.runTextSearch('espelho redondo', { limit: 100 }))
    expect(mocks.text).toHaveBeenCalledTimes(2)
    act(() => result.current.clear())
    await act(() => result.current.runTextSearch('espelho redondo', { limit: 100 }))
    expect(mocks.text).toHaveBeenCalledTimes(3)
  })

  it('uma falha transitória no modelo continua permitindo recuperação', async () => {
    mocks.text
      .mockRejectedValueOnce(new Error('download interrupted'))
      .mockResolvedValueOnce([1, 0])
    const { result } = renderHook(() => useImageSearch())
    await act(() => result.current.runTextSearch('quadro azul', { limit: 100 }))
    expect(mocks.text).toHaveBeenCalledTimes(2)
    expect(mocks.search).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('empty')
  })
})
