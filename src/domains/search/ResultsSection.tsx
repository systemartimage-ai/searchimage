import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { SearchResult } from './searchMockCatalog'
import type { SearchStatus } from './useImageSearch'
import { ResultsToolbar } from './ResultsToolbar'
import { ResultCard } from './ResultCard'

// Quantos resultados a mais o botão "Carregar mais" busca por clique —
// pedido do usuário: abre 100, e ao chegar no fim dá pra pedir mais 100,
// de novo e de novo, em vez de já abrir tudo de uma vez.
const LOAD_MORE_STEP = 100

interface ResultsSectionProps {
  status: SearchStatus
  results: SearchResult[]
  onFiltersChange: (filters: { limit: number; category: string; code: string }) => void | Promise<void>
}

export function ResultsSection({ status, results, onFiltersChange }: ResultsSectionProps) {
  const [limit, setLimit] = useState(100)
  const [category, setCategory] = useState('')
  const [code, setCode] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Assim que a busca termina (achou algo ou não), desce a página
  // sozinha até aqui — sem isso o usuário precisava rolar manualmente
  // pra ver os resultados, que ficam abaixo da caixa de busca. Só
  // dispara na transição pra 'success'/'empty' (não fica re-rolando a
  // cada ajuste de filtro, já que o status continua o mesmo).
  useEffect(() => {
    if (status === 'success' || status === 'empty') {
      // scrollIntoView não existe em jsdom (ambiente de teste) — só
      // no navegador real.
      containerRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    }
  }, [status])

  function update(next: Partial<{ limit: number; category: string; code: string }>) {
    const merged = { limit, category, code, ...next }
    setLimit(merged.limit)
    setCategory(merged.category)
    setCode(merged.code)
    return onFiltersChange(merged)
  }

  async function handleLoadMore() {
    setLoadingMore(true)
    try {
      await update({ limit: limit + LOAD_MORE_STEP })
    } finally {
      setLoadingMore(false)
    }
  }

  // O feedback de carregamento agora é o overlay de scan em cima da
  // própria foto anexada (Dropzone/ScanOverlay) — mais visível do que
  // um spinner aqui embaixo, que passava despercebido.
  if (status === 'embedding' || status === 'searching') return null

  if (status === 'empty') {
    return (
      <div ref={containerRef} className="flex w-full flex-col gap-6">
        <ResultsToolbar
          limit={limit}
          category={category}
          code={code}
          onLimitChange={(v) => update({ limit: v })}
          onCategoryChange={(v) => update({ category: v })}
          onCodeChange={(v) => update({ code: v })}
        />
        <p className="w-full py-12 text-center text-sm text-muted-foreground">
          Nenhum resultado encontrado com os filtros atuais. Tente ajustar a categoria ou o código.
        </p>
      </div>
    )
  }

  if (status !== 'success') return null

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-6">
      <ResultsToolbar
        limit={limit}
        category={category}
        code={code}
        onLimitChange={(v) => update({ limit: v })}
        onCategoryChange={(v) => update({ category: v })}
        onCodeChange={(v) => update({ code: v })}
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {results.map((r) => (
          <ResultCard key={r.item.id} item={r.item} score={r.score} />
        ))}
      </div>

      {results.length >= limit && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Carregando...' : `Carregar mais ${LOAD_MORE_STEP}`}
          </Button>
        </div>
      )}
    </div>
  )
}
