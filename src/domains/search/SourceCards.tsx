import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { useLocalDirectory } from '@/domains/localDirectory/useLocalDirectory'

interface SourceCardsProps {
  localDirectory: ReturnType<typeof useLocalDirectory>
}

// O catálogo indexado (site) é sempre pesquisado — é infraestrutura de
// backend, o usuário não precisa saber que existe nem ver status dele.
// Só a fonte que depende de uma ação do usuário (conectar uma pasta)
// aparece na tela.
export function SourceCards({ localDirectory }: SourceCardsProps) {
  const [includeSubfolders, setIncludeSubfolders] = useState(true)
  const { folders, connect, removeFolder, supported } = localDirectory

  if (!supported) return null

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Buscar também numa pasta específica</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
        {folders.length === 0 && (
          <span>
            Conecte uma ou mais pastas do seu computador para incluí-las na busca. As imagens não
            saem do seu dispositivo — o processamento é feito localmente no navegador.
          </span>
        )}

        {folders.map((folder) => (
          <div
            key={folder.id}
            className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
          >
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{folder.name}</span>
              {folder.status === 'indexing' && (
                <span>
                  Indexando... {folder.done}
                  {folder.total ? ` de ${folder.total}` : ''}
                  {folder.includeSubfolders ? ' (com subpastas)' : ''}
                </span>
              )}
              {folder.status === 'ready' && (
                <span>
                  {folder.done} imagem{folder.done === 1 ? '' : 's'} indexada
                  {folder.done === 1 ? '' : 's'}
                  {folder.includeSubfolders ? ' (com subpastas)' : ''}
                </span>
              )}
              {folder.status === 'error' && (
                <span role="alert" className="text-destructive">
                  {folder.errorMessage}
                </span>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={() => removeFolder(folder.id)}>
              Remover
            </Button>
          </div>
        ))}

        <div className="flex flex-col gap-2 border-t pt-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeSubfolders}
              onChange={(e) => setIncludeSubfolders(e.target.checked)}
            />
            Incluir subpastas
          </label>
          <Button
            size="sm"
            variant="outline"
            className="w-fit"
            onClick={() => connect(includeSubfolders)}
          >
            {folders.length === 0 ? 'Selecionar pasta' : 'Selecionar outra pasta'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
