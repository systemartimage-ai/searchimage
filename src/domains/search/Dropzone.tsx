import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DropzoneProps {
  previewUrl: string | null
  onSelectFile: (file: File) => void
  onRemove: () => void
  onSearch: () => void
  searching: boolean
}

export function Dropzone({
  previewUrl,
  onSelectFile,
  onRemove,
  onSearch,
  searching,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

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
        <img
          src={previewUrl}
          alt="Prévia da imagem de consulta"
          className="max-h-72 rounded-lg border border-border object-contain"
        />
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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-16 text-center transition-colors hover:border-primary/50 hover:bg-accent/40',
        dragOver && 'border-primary bg-accent/60',
      )}
    >
      <p className="text-lg font-medium text-foreground">
        Arraste uma imagem aqui ou clique para selecionar
      </p>
      <p className="text-sm text-muted-foreground">JPG, PNG ou WebP — até 10MB</p>
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
