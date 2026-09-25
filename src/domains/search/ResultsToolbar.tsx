import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Categorias reais do REAL_CATALOG_SAMPLE (site-fonte artimage.com.br:
// art-gallery, collectibles, artsy, mirror-design) — ver realCatalogSample.ts.
const CATEGORIES = ['Quadros', 'Colecionáveis', 'Artsy', 'Espelhos']
const LIMIT_OPTIONS = [10, 20, 50]

interface ResultsToolbarProps {
  limit: number
  category: string
  code: string
  onLimitChange: (limit: number) => void
  onCategoryChange: (category: string) => void
  onCodeChange: (code: string) => void
}

export function ResultsToolbar({
  limit,
  category,
  code,
  onLimitChange,
  onCategoryChange,
  onCodeChange,
}: ResultsToolbarProps) {
  return (
    <div className="flex w-full flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-limit">Resultados</Label>
        <select
          id="filter-limit"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
        >
          {LIMIT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              Top {n}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-category">Categoria</Label>
        <select
          id="filter-category"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">Todas</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-code">Código</Label>
        <Input
          id="filter-code"
          placeholder="ex.: MOCK-0001"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          className="h-9 w-40"
        />
      </div>

      <p className="pb-2 text-xs text-muted-foreground">Ordenado por similaridade</p>
    </div>
  )
}
