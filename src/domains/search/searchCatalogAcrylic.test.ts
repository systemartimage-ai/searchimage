import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc,
    // Confirmação "ativo no site": sem resultados, nenhum item é marcado.
    from: () => {
      const chain: Record<string, unknown> = {}
      for (const m of ['select', 'in', 'eq', 'abortSignal']) chain[m] = () => chain
      chain.then = (resolve: (v: unknown) => void) => resolve({ data: [], error: null })
      return chain
    },
  },
}))

import { searchCatalog } from './searchCatalog'

function row(id: string, score: number) {
  return { id, title: id, code: id, category: null, source: 'Upload Admin', thumbnail_url: '', score }
}

const emb = [1, 0]

beforeEach(() => rpc.mockReset())

describe('searchCatalog — acrílico', () => {
  it('acrílicos primeiro e depois os demais mais parecidos, sem repetir', async () => {
    rpc.mockResolvedValueOnce({ data: [row('a1', 0.9), row('a2', 0.8)], error: null })
    rpc.mockResolvedValueOnce({ data: [row('a1', 0.95), row('x1', 0.85), row('x2', 0.7)], error: null })

    const result = await searchCatalog(emb, { limit: 4 }, ['acrilico'])

    expect(result.map((r) => r.item.id)).toEqual(['a1', 'a2', 'x1', 'x2'])
    expect(rpc.mock.calls[0][1].tag_keywords).toEqual(['acrilico'])
    expect(rpc.mock.calls[1][1].tag_keywords).toBeNull()
  })

  it('"Somente acrílicos" não completa com outros itens', async () => {
    rpc.mockResolvedValueOnce({ data: [row('a1', 0.9)], error: null })

    const result = await searchCatalog(emb, { limit: 10, acrylicOnly: true }, [])

    expect(result.map((r) => r.item.id)).toEqual(['a1'])
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('não busca o resto quando os acrílicos já preenchem o limite', async () => {
    rpc.mockResolvedValueOnce({ data: [row('a1', 0.9), row('a2', 0.8)], error: null })

    const result = await searchCatalog(emb, { limit: 2 }, ['acrilico'])

    expect(result).toHaveLength(2)
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('mantém as demais tags exigidas junto com acrílico (ex.: leão acrílico)', async () => {
    rpc.mockResolvedValueOnce({ data: [row('a1', 0.9)], error: null })

    await searchCatalog(emb, { limit: 1 }, ['leao', 'acrilico'])

    expect(rpc.mock.calls[0][1].tag_keywords).toEqual(['leao', 'acrilico'])
  })
})
