import { Button } from '@/components/ui/button'
import { formatBytes, projectFromAverage } from './bulkUploadLogic'
import type { useBulkUpload } from './useBulkUpload'

interface ScanSummaryProps {
  bulk: ReturnType<typeof useBulkUpload>
}

export function ScanSummary({ bulk }: ScanSummaryProps) {
  const projection = projectFromAverage(bulk.avgBytesPerFile, bulk.totalSelected)
  const busy = bulk.status === 'uploading' || bulk.status === 'done'

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3 text-sm">
      <div>
        <span className="font-medium text-foreground">{bulk.rootFolderName}</span>
        <span className="text-muted-foreground">
          {' '}
          — {bulk.totalScanned} arquivo{bulk.totalScanned === 1 ? '' : 's'} elegível
          {bulk.totalScanned === 1 ? '' : 'eis'}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {bulk.groups.map((group) => (
          <label key={group.key} className="flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              checked={!bulk.excludedGroups.has(group.key)}
              disabled={busy}
              onChange={() => bulk.toggleGroup(group.key)}
            />
            <span className="text-foreground">{group.label}</span>
            <span>({group.fileCount})</span>
          </label>
        ))}
      </div>

      <div className="border-t border-border pt-2 text-muted-foreground">
        Selecionado: <span className="text-foreground">{bulk.totalSelected}</span> arquivo
        {bulk.totalSelected === 1 ? '' : 's'}
        {bulk.avgBytesPerFile > 0 && (
          <>
            {' '}
            — projeção de armazenamento:{' '}
            <span className="text-foreground">{formatBytes(projection.projectedBytes)}</span> (
            {projection.pctOfFreeTier.toFixed(1)}% do free tier de 1GB de Storage)
          </>
        )}
      </div>

      {bulk.status === 'scanned' && (
        <Button onClick={bulk.confirmAndUpload} disabled={bulk.totalSelected === 0} className="w-fit">
          Enviar {bulk.totalSelected} imagem{bulk.totalSelected === 1 ? '' : 's'}
        </Button>
      )}
    </div>
  )
}
