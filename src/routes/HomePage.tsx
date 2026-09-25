import { Header } from '@/components/Header'
import { Dropzone } from '@/domains/search/Dropzone'
import { SourceCards } from '@/domains/search/SourceCards'
import { ResultsSection } from '@/domains/search/ResultsSection'
import { useImageSearch } from '@/domains/search/useImageSearch'

export function HomePage() {
  const { status, previewUrl, results, errorMessage, selectFile, clear, runSearch, applyFilters } =
    useImageSearch()

  const isBusy = status === 'embedding' || status === 'searching'
  const showResults = ['embedding', 'searching', 'success', 'empty'].includes(status)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10">
        <div className="flex flex-col items-center gap-6 text-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Search Image</h1>
            <p className="mt-1 text-muted-foreground">
              Envie uma imagem para encontrar itens visualmente semelhantes.
            </p>
          </div>

          <Dropzone
            previewUrl={previewUrl}
            onSelectFile={selectFile}
            onRemove={clear}
            onSearch={() => runSearch({ limit: 10 })}
            searching={isBusy}
          />

          {status === 'error' && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="self-start text-sm font-medium text-muted-foreground">Onde pesquisar?</h2>
          <SourceCards />
        </div>

        {showResults && (
          <ResultsSection status={status} results={results} onFiltersChange={applyFilters} />
        )}
      </main>
    </div>
  )
}
