import { Button } from '@/components/ui/button'
import type { useBulkUpload } from './useBulkUpload'

interface UploadProgressProps {
  bulk: ReturnType<typeof useBulkUpload>
}

export function UploadProgress({ bulk }: UploadProgressProps) {
  const { done, total, uploaded, skipped, errors } = bulk.progress

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: total ? `${(done / total) * 100}%` : '0%' }}
        />
      </div>
      <div className="text-muted-foreground">
        {done} de {total} — {uploaded} enviada{uploaded === 1 ? '' : 's'}, {skipped} já existia
        {skipped === 1 ? '' : 'm'}, {errors} com erro
      </div>
      {bulk.status === 'uploading' && (
        <Button size="sm" variant="outline" onClick={bulk.stop} className="w-fit">
          Parar
        </Button>
      )}
      {bulk.status === 'done' && !bulk.errorMessage && (
        <span className="text-foreground">Concluído — já visível na busca.</span>
      )}
    </div>
  )
}
