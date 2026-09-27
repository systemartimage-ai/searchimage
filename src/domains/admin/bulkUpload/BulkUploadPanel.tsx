import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useBulkUpload } from './useBulkUpload'
import { ScanSummary } from './ScanSummary'
import { UploadProgress } from './UploadProgress'
import { ErrorList } from './ErrorList'

export function BulkUploadPanel() {
  const bulk = useBulkUpload()

  if (!bulk.supported) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Essa ferramenta precisa de um navegador baseado em Chromium (Chrome/Edge) — o navegador atual
          não suporta seleção de pasta.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Upload em massa de imagens</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {bulk.status === 'idle' && (
          <>
            <p className="text-sm text-muted-foreground">
              Selecione uma pasta no seu computador. A ferramenta escaneia todas as subpastas,
              compacta, gera o embedding visual e as tags de cada imagem, e publica direto no
              catálogo — já visível na busca assim que terminar.
            </p>
            <Button onClick={bulk.pickFolder} className="w-fit">
              Selecionar pasta
            </Button>
          </>
        )}

        {bulk.status === 'scanning' && (
          <p className="text-sm text-muted-foreground">Escaneando pasta...</p>
        )}

        {(bulk.status === 'scanned' || bulk.status === 'uploading' || bulk.status === 'done') && (
          <ScanSummary bulk={bulk} />
        )}

        {(bulk.status === 'uploading' || bulk.status === 'done') && <UploadProgress bulk={bulk} />}

        {(bulk.status === 'uploading' || bulk.status === 'done') && <ErrorList bulk={bulk} />}

        {bulk.errorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {bulk.errorMessage}
          </p>
        )}

        {bulk.status === 'done' && (
          <Button variant="outline" onClick={bulk.reset} className="w-fit">
            Enviar outra pasta
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
