import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { SearchResult } from './searchMockCatalog'

function similarityLabel(score: number): string {
  if (score >= 0.9) return 'Muito semelhante'
  if (score >= 0.7) return 'Semelhante'
  if (score >= 0.4) return 'Pouco semelhante'
  return 'Diferente'
}

export function ResultCard({ item, score }: SearchResult) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(item.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard indisponível (ex.: contexto não seguro) — falha silenciosa é aceitável aqui,
      // o código continua visível no card para cópia manual.
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="block w-full"
          aria-label={`Ampliar imagem de ${item.title}`}
        >
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            loading="lazy"
            className="aspect-square w-full object-cover"
          />
        </button>
        <CardContent className="flex flex-col gap-1.5 pt-4">
          {item.activeOnSite && (
            <p
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-700"
              title="Ativo no catálogo do site Artimage, conforme a última indexação."
            >
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600" />
              <span>Produto ativo no site</span>
            </p>
          )}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="min-w-0 break-words font-medium text-foreground">{item.title}</h3>
            <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {similarityLabel(score)}
            </span>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {item.code} · {item.source}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleCopyCode}>
              {copied ? 'Copiado!' : 'Copiar código'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setLightboxOpen(true)}>
              Ampliar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled
              title="Item de teste — sem página real ainda"
            >
              Abrir original
            </Button>
          </div>
        </CardContent>
      </Card>

      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={item.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
          />
          <Button
            variant="secondary"
            size="sm"
            className="absolute right-4 top-4"
            onClick={() => setLightboxOpen(false)}
          >
            Fechar
          </Button>
        </div>
      )}
    </>
  )
}
