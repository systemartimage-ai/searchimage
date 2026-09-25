import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MOCK_CATALOG, MOCK_CATALOG_LAST_UPDATED } from '@/domains/catalog/mockCatalogData'
import { cn } from '@/lib/utils'

export function SourceCards() {
  const lastUpdated = new Date(MOCK_CATALOG_LAST_UPDATED).toLocaleDateString('pt-BR')

  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <Card className={cn('border-primary/40 bg-accent/30')}>
        <CardHeader>
          <CardTitle className="text-base">Catálogo Indexado</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Pronto (dados de teste)</span>
          <span>{MOCK_CATALOG.length} itens</span>
          <span>Última atualização: {lastUpdated}</span>
        </CardContent>
      </Card>

      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-base">Diretório Local</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
          <span>Em breve (Fase 7)</span>
          <span>Você poderá conectar uma pasta do seu computador para pesquisar nela.</span>
        </CardContent>
      </Card>
    </div>
  )
}
