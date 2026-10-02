import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ScanOverlay } from './ScanOverlay'

interface DropzoneProps {
  previewUrl: string | null
  onSelectFile: (file: File) => void
  onRemove: () => void
  onSearch: () => void
  /** Desabilita os controles enquanto QUALQUER busca roda (imagem ou texto). */
  searching: boolean
  /** Mostra o overlay de scan só quando a busca em andamento foi disparada por ESTA caixa. */
  scanActive: boolean
  /** Texto do overlay de scan enquanto `scanActive` é true (ex.: etapa atual do pipeline). */
  scanLabel?: string
  /** O marcador visual achou que a foto parece acrílico. */
  looksAcrylic?: boolean
}

export function Dropzone({
  previewUrl,
  onSelectFile,
  onRemove,
  onSearch,
  searching,
  scanActive,
  scanLabel,
  looksAcrylic = false,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  // Ctrl+V em qualquer lugar da página cola a imagem, sem precisar
  // clicar em nada antes — mesmo comportamento do drag-and-drop, só
  // que via colar. Ignora silenciosamente se o que foi colado não for
  // imagem (ex. colar texto em outro campo continua funcionando normal).
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const imageItem = Array.from(e.clipboardData?.items ?? []).find((item) =>
        item.type.startsWith('image/'),
      )
      const file = imageItem?.getAsFile()
      if (file) onSelectFile(file)
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [onSelectFile])

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) onSelectFile(dropped)
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) onSelectFile(selected)
    e.target.value = ''
  }

  if (previewUrl) {
    return (
      <div className="flex w-full flex-col items-center gap-4">
        <div className="relative">
          <img
            src={previewUrl}
            alt="Prévia da imagem de consulta"
            className="max-h-72 rounded-lg border border-border object-contain"
          />
          {scanActive && <ScanOverlay label={scanLabel ?? 'Analisando com IA...'} />}
        </div>
        {looksAcrylic && !scanActive && (
          <p
            className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
            title="A foto parece um produto de acrílico: os acrílicos aparecem primeiro nos resultados."
          >
            Acrílico (provável)
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            Trocar imagem
          </Button>
          <Button variant="outline" onClick={onRemove}>
            Remover
          </Button>
          <Button onClick={onSearch} disabled={searching}>
            {searching ? 'Pesquisando...' : 'Pesquisar'}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    )
  }

  // O clique pra abrir o seletor de arquivo fica só no botão pequeno,
  // não na área inteira — antes, clicar em qualquer lugar (inclusive
  // sem querer, só pra focar a página antes de dar Ctrl+V) já abria o
  // seletor de arquivo do SO, atrapalhando quem só queria colar.
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border px-6 py-16 text-center transition-colors',
        dragOver && 'border-primary bg-accent/60',
      )}
    >
      <p className="text-lg font-medium text-foreground">
        Arraste uma imagem aqui ou cole com Ctrl+V
      </p>
      <p className="text-sm text-muted-foreground">JPG, PNG ou WebP — até 10MB</p>
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        Selecionar arquivo
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
