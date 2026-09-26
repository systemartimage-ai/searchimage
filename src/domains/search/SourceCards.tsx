import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface CatalogStatus {
  totalItems: number
  lastUpdated: string | null
}

export function SourceCards() {
  const [status, setStatus] = useState<CatalogStatus | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [{ count }, { data: version }] = await Promise.all([
        supabase.from('catalog_items').select('id', { count: 'exact', head: true }),
        supabase
          .from('index_versions')
          .select('activated_at')
          .eq('status', 'ACTIVE')
          .order('activated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      if (!cancelled) {
        setStatus({ totalItems: count ?? 0, lastUpdated: version?.activated_at ?? null })
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <Card className={cn('border-primary/40 bg-accent/30')}>
        <CardHeader>
          <CardTitle className="text-base">Catálogo Indexado</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {status ? 'Pronto' : 'Carregando...'}
          </span>
          {status && (
            <>
              <span>{status.totalItems} itens</span>
              {status.lastUpdated && (
                <span>
                  Última atualização: {new Date(status.lastUpdated).toLocaleDateString('pt-BR')}
                </span>
              )}
            </>
          )}
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
