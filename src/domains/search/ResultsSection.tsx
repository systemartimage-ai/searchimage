import { useState } from 'react'
import type { SearchResult } from './searchMockCatalog'
import type { SearchStatus } from './useImageSearch'
import { ResultsToolbar } from './ResultsToolbar'
import { ResultCard } from './ResultCard'

interface ResultsSectionProps {
  status: SearchStatus
  results: SearchResult[]
  onFiltersChange: (filters: { limit: number; category: string; code: string }) => void
}

export function ResultsSection({ status, results, onFiltersChange }: ResultsSectionProps) {
  const [limit, setLimit] = useState(100)
  const [category, setCategory] = useState('')
  const [code, setCode] = useState('')

  function update(next: Partial<{ limit: number; category: string; code: string }>) {
    const merged = { limit, category, code, ...next }
    setLimit(merged.limit)
    setCategory(merged.category)
    setCode(merged.code)
    onFiltersChange(merged)
  }

  // O feedback de carregamento agora é o overlay de scan em cima da
  // própria foto anexada (Dropzone/ScanOverlay) — mais visível do que
  // um spinner aqui embaixo, que passava despercebido.
  if (status === 'embedding' || status === 'searching') return null

  if (status === 'empty') {
    return (
      <div className="flex w-full flex-col gap-6">
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
    <div className="flex w-full flex-col gap-6">
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
    </div>
  )
}
