import { Button } from '@/components/ui/button'
import type { useBulkUpload } from './useBulkUpload'

interface ErrorListProps {
  bulk: ReturnType<typeof useBulkUpload>
}

export function ErrorList({ bulk }: ErrorListProps) {
  if (bulk.progress.errors === 0) return null

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-destructive">
          {bulk.progress.errors} erro{bulk.progress.errors === 1 ? '' : 's'}
        </span>
        <Button size="sm" variant="outline" onClick={bulk.downloadErrorLog}>
          Baixar log (.csv)
        </Button>
      </div>
      <div className="flex max-h-40 flex-col gap-0.5 overflow-y-auto text-muted-foreground">
        {bulk.recentErrors.map((e, i) => (
          <div key={i} className="truncate">
            {e.relativePath} — {e.errorStage}: {e.errorMessage}
          </div>
        ))}
      </div>
    </div>
  )
}
