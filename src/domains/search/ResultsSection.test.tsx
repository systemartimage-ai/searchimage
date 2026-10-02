import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResultsSection } from './ResultsSection'
import type { SearchResult } from './searchMockCatalog'
import type { CatalogItem } from '@/domains/catalog/types'

function makeResults(count: number): SearchResult[] {
  return Array.from({ length: count }, (_, i) => {
    const item: CatalogItem = {
      id: `item-${i}`,
      title: `Item ${i}`,
      code: `code-${i}`,
      category: '',
      source: 'Artimage',
      thumbnailUrl: `thumb-${i}.jpg`,
      embedding: [],
    }
    return { item, score: 1 - i / count }
  })
}

// Pedido do usuário: busca abre 100 resultados, e ao chegar no fim dá pra
// pedir mais 100 (de novo e de novo) em vez de já trazer tudo de uma vez.
describe('ResultsSection — carregar mais resultados', () => {
  it('não mostra o botão "Carregar mais" quando os resultados não preenchem o limite (fim natural da busca)', () => {
    render(
      <ResultsSection status="success" results={makeResults(30)} onFiltersChange={vi.fn()} />,
    )
    expect(screen.queryByRole('button', { name: /carregar mais/i })).not.toBeInTheDocument()
  })

  it('mostra o botão "Carregar mais" quando os resultados atingem o limite padrão (100)', () => {
    render(
      <ResultsSection status="success" results={makeResults(100)} onFiltersChange={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /carregar mais 100/i })).toBeInTheDocument()
  })

  it('ao clicar, pede o limite atual + 100 sem perder categoria/código já filtrados', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn().mockResolvedValue(undefined)
    render(
      <ResultsSection status="success" results={makeResults(100)} onFiltersChange={onFiltersChange} />,
    )

    await user.click(screen.getByRole('button', { name: /carregar mais 100/i }))

    expect(onFiltersChange).toHaveBeenCalledWith({ limit: 200, category: '', code: '' })
  })
})
