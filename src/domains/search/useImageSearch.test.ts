import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useImageSearch } from './useImageSearch'
import { reportModelProgress } from '@/domains/embedding/modelProgress'

const mocks = vi.hoisted(() => ({
  image: vi.fn(),
  text: vi.fn(),
  search: vi.fn(),
  marker: vi.fn(),
  downscale: vi.fn(),
}))
afterEach(() => vi.restoreAllMocks())
vi.mock('@/domains/embedding', () => ({
  ClipEmbeddingProvider: class {
    embedImage = mocks.image
  },
  ClipTextEmbeddingProvider: class {
    embedText = mocks.text
  },
  isPersonQuery: (text: string) => /mulher|menina/i.test(text),
}))
vi.mock('@/domains/catalog/loadAcrylicMarker', () => ({
  loadAcrylicMarker: () => mocks.marker(),
}))
vi.mock('@/domains/catalog/loadPessoasPrototype', () => ({
  loadPessoasPrototype: async () => [0, 1],
}))
vi.mock('./prepareImage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./prepareImage')>()),
  downscaleImage: (file: File) => mocks.downscale(file),
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
  mocks.marker.mockReset().mockResolvedValue({ w: [0, 0], b: -10 })
  mocks.downscale.mockReset().mockImplementation(async (file: File) => file)
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

describe('busca por menina/mulher mistura o protótipo visual', () => {
  it('envia ao banco texto + protótipo só para essas buscas', async () => {
    const { result } = renderHook(() => useImageSearch())
    await act(() => result.current.runTextSearch('mulher', { limit: 100 }))
    const sent = mocks.search.mock.calls[0][0] as number[]
    expect(sent[0]).toBeCloseTo(Math.SQRT1_2)
    expect(sent[1]).toBeCloseTo(Math.SQRT1_2)
  })

  it('não altera o vetor das demais buscas', async () => {
    const { result } = renderHook(() => useImageSearch())
    await act(() => result.current.runTextSearch('céu azul', { limit: 100 }))
    expect(mocks.search.mock.calls[0][0]).toEqual([1, 0])
  })
})

describe('busca de acrílico — timeout com cache frio', () => {
  it('repete uma vez quando a busca de acrílico dá timeout', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    mocks.search.mockRejectedValueOnce({ code: '57014' }).mockResolvedValueOnce([])
    const { result } = renderHook(() => useImageSearch())
    await act(() => result.current.runTextSearch('acrílico', { limit: 100 }))
    expect(mocks.search).toHaveBeenCalledTimes(2)
    expect(result.current.errorMessage).toBeNull()
  })

  it('não repete timeout das demais buscas', async () => {
    mocks.search.mockRejectedValueOnce({ code: '57014' })
    const { result } = renderHook(() => useImageSearch())
    await act(() => result.current.runTextSearch('quadro azul', { limit: 100 }))
    expect(mocks.search).toHaveBeenCalledTimes(1)
  })
})

describe('"Priorizar acrílicos"', () => {
  it('acrescenta a tag acrilico à busca quando marcado', async () => {
    const { result } = renderHook(() => useImageSearch())
    await act(() => result.current.runTextSearch('céu azul', { limit: 100, prioritizeAcrylic: true }))
    expect(mocks.search.mock.calls[0][2]).toContain('acrilico')
  })

  it('não altera a busca quando desmarcado', async () => {
    const { result } = renderHook(() => useImageSearch())
    await act(() => result.current.runTextSearch('céu azul', { limit: 100 }))
    expect(mocks.search.mock.calls[0][2] ?? []).not.toContain('acrilico')
  })

  it('"Carregar mais"/filtros mantêm a prioridade escolhida', async () => {
    const { result } = renderHook(() => useImageSearch())
    await act(() => result.current.runTextSearch('céu azul', { limit: 100, prioritizeAcrylic: true }))
    await act(() => result.current.applyFilters({ limit: 200, prioritizeAcrylic: true }))
    expect(mocks.search.mock.calls[1][2]).toContain('acrilico')
  })
})

describe('marcador visual de acrílico (busca por imagem)', () => {
  it('foto que parece acrílico: prioriza acrílicos e mostra a etiqueta', async () => {
    mocks.marker.mockResolvedValue({ w: [10, 0], b: -5 })
    const { result } = renderHook(() => useImageSearch())
    act(() => result.current.selectFile(new File(['image'], 'foto.png', { type: 'image/png' })))
    await act(() => result.current.runSearch({ limit: 100 }))
    expect(mocks.search.mock.calls[0][2]).toContain('acrilico')
    expect(result.current.imageLooksAcrylic).toBe(true)
  })

  it('foto que não parece acrílico: busca normal, sem etiqueta', async () => {
    const { result } = renderHook(() => useImageSearch())
    act(() => result.current.selectFile(new File(['image'], 'foto.png', { type: 'image/png' })))
    await act(() => result.current.runSearch({ limit: 100 }))
    expect(mocks.search.mock.calls[0][2] ?? []).not.toContain('acrilico')
    expect(result.current.imageLooksAcrylic).toBe(false)
  })

  it('falha ao carregar o marcador não derruba a busca', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    mocks.marker.mockRejectedValue(new Error('chunk'))
    const { result } = renderHook(() => useImageSearch())
    act(() => result.current.selectFile(new File(['image'], 'foto.png', { type: 'image/png' })))
    await act(() => result.current.runSearch({ limit: 100 }))
    expect(result.current.status).toBe('empty')
    expect(result.current.imageLooksAcrylic).toBe(false)
  })
})

const MB = 1024 * 1024
const bigPhoto = () => new File([new Uint8Array(4 * MB)], 'IMG_1.jpg', { type: 'image/jpeg' })

describe('foto grande da câmera', () => {
  it('foto pequena entra na hora, sem reduzir', () => {
    const { result } = renderHook(() => useImageSearch())
    act(() => result.current.selectFile(new File(['x'], 'a.png', { type: 'image/png' })))
    expect(mocks.downscale).not.toHaveBeenCalled()
    expect(result.current.preparingPhoto).toBe(false)
    expect(result.current.status).toBe('preview')
  })

  it('foto grande: mostra "preparando" enquanto reduz e depois entra a versão reduzida', async () => {
    let finish: (file: File) => void = () => {}
    mocks.downscale.mockImplementation(() => new Promise<File>((resolve) => (finish = resolve)))
    const { result } = renderHook(() => useImageSearch())

    act(() => result.current.selectFile(bigPhoto()))
    expect(result.current.preparingPhoto).toBe(true)
    expect(result.current.file).toBeNull()

    const reduced = new File(['pequena'], 'IMG_1.jpg', { type: 'image/jpeg' })
    await act(async () => finish(reduced))

    expect(result.current.preparingPhoto).toBe(false)
    expect(result.current.file).toBe(reduced)
    expect(result.current.status).toBe('preview')
  })

  it('se o usuário escolhe outra foto enquanto a primeira é reduzida, vale a última', async () => {
    const pending: Array<(file: File) => void> = []
    mocks.downscale.mockImplementation(() => new Promise<File>((resolve) => pending.push(resolve)))
    const { result } = renderHook(() => useImageSearch())

    act(() => result.current.selectFile(bigPhoto()))
    const second = new File(['segunda'], 'B.png', { type: 'image/png' })
    act(() => result.current.selectFile(second))
    await act(async () => pending[0](new File(['primeira'], 'A.jpg', { type: 'image/jpeg' })))

    expect(result.current.file).toBe(second)
  })

  it('foto da câmera acima de 10 MB passa a ser aceita depois de reduzida', async () => {
    const huge = new File([new Uint8Array(12 * MB)], 'IMG_2.jpg', { type: 'image/jpeg' })
    mocks.downscale.mockResolvedValue(new File([new Uint8Array(2 * MB)], 'IMG_2.jpg', { type: 'image/jpeg' }))
    const { result } = renderHook(() => useImageSearch())

    await act(async () => result.current.selectFile(huge))

    expect(result.current.status).toBe('preview')
    expect(result.current.errorMessage).toBeNull()
  })

  it('se mesmo reduzida continuar acima de 10 MB, mostra o aviso de tamanho', async () => {
    mocks.downscale.mockImplementation(async (file: File) => file)
    const { result } = renderHook(() => useImageSearch())

    await act(async () => result.current.selectFile(new File([new Uint8Array(12 * MB)], 'X.jpg', { type: 'image/jpeg' })))

    expect(result.current.errorMessage).toMatch(/muito grande/i)
  })
})

describe('progresso do download da IA', () => {
  it('expõe a porcentagem enquanto o modelo baixa e limpa quando termina', () => {
    const { result } = renderHook(() => useImageSearch())
    expect(result.current.modelProgress).toBeNull()

    act(() =>
      reportModelProgress({ status: 'progress', name: 'clip', file: 'v.onnx', loaded: 100 * MB, total: 200 * MB }),
    )
    expect(result.current.modelProgress).toEqual({ loadedMB: 100, totalMB: 200, percent: 50, stage: 1 })

    act(() => reportModelProgress({ status: 'ready' }))
    expect(result.current.modelProgress).toBeNull()
  })
})
