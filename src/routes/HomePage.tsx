import { Header } from '@/components/Header'
import { Dropzone } from '@/domains/search/Dropzone'
import { TextSearchBox } from '@/domains/search/TextSearchBox'
import { SourceCards } from '@/domains/search/SourceCards'
import { ResultsSection } from '@/domains/search/ResultsSection'
import { useImageSearchContext } from '@/domains/search/useImageSearchContext'
import { useLocalDirectoryContext } from '@/domains/localDirectory/useLocalDirectoryContext'

export function HomePage() {
  const localDirectory = useLocalDirectoryContext()
  const {
    status,
    searchMode,
    previewUrl,
    results,
    errorMessage,
    selectFile,
    clear,
    runSearch,
    runTextSearch,
    applyFilters,
  } = useImageSearchContext()

  const isBusy = status === 'embedding' || status === 'searching'
  const showResults = ['embedding', 'searching', 'success', 'empty'].includes(status)
  const scanLabel =
    status === 'embedding'
      ? 'Gerando impressão digital visual...'
      : status === 'searching'
        ? 'Comparando com o catálogo...'
        : undefined

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-6 sm:py-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div>
            <h1 className="font-serif text-5xl italic tracking-tight text-foreground sm:text-6xl">
              Artimage Search
            </h1>
            <p className="mt-3 text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Envie uma imagem ou descreva o que procura
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            <Dropzone
              previewUrl={previewUrl}
              onSelectFile={selectFile}
              onRemove={clear}
              onSearch={() => runSearch({ limit: 100 })}
              searching={isBusy}
              scanActive={isBusy && searchMode === 'image'}
              scanLabel={scanLabel}
            />
            <TextSearchBox
              onSearch={(text) => runTextSearch(text, { limit: 100 })}
              searching={isBusy}
              scanActive={isBusy && searchMode === 'text'}
              scanLabel={scanLabel}
            />
          </div>

          {status === 'error' && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          )}
        </div>

        {localDirectory.supported && (
          <div className="flex flex-col items-center gap-2">
            <SourceCards localDirectory={localDirectory} />
          </div>
        )}

        {showResults && (
          <ResultsSection status={status} results={results} onFiltersChange={applyFilters} />
        )}
      </main>
    </div>
  )
}
