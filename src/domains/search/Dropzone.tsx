import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type RefObject,
} from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isMobileDevice } from '@/domains/pwa/platform'
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
  /** A foto grande (câmera) está sendo reduzida antes de entrar na busca. */
  preparingPhoto?: boolean
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
  preparingPhoto = false,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [chooserOpen, setChooserOpen] = useState(false)
  // Depois de tirar/escolher a foto o celular leva alguns segundos para entregá-la
  // ao navegador (a câmera salva e converte a imagem). Sem aviso parecia erro.
  const [receivingPhoto, setReceivingPhoto] = useState(false)

  // No celular o clique abre uma escolha: tirar uma foto agora ou escolher uma
  // imagem dos arquivos/galeria. No computador abre direto o seletor de arquivos.
  const mobile =
    typeof navigator !== 'undefined' && isMobileDevice(navigator.userAgent, navigator.maxTouchPoints)

  function openPicker() {
    if (mobile) setChooserOpen(true)
    else inputRef.current?.click()
  }

  function pickFrom(input: RefObject<HTMLInputElement | null>) {
    setChooserOpen(false)
    setReceivingPhoto(true)
    input.current?.click()
  }

  // O aviso some quando a foto chega, quando o usuário cancela (evento "cancel"
  // do seletor), quando toca na tela de novo, ou após 60 s (rede de segurança).
  useEffect(() => {
    if (!receivingPhoto) return
    const stop = () => setReceivingPhoto(false)
    const inputs = [inputRef.current, cameraRef.current]
    inputs.forEach((input) => input?.addEventListener('cancel', stop))
    window.addEventListener('pointerdown', stop, { once: true })
    const timer = window.setTimeout(stop, 60_000)
    return () => {
      inputs.forEach((input) => input?.removeEventListener('cancel', stop))
      window.removeEventListener('pointerdown', stop)
      window.clearTimeout(timer)
    }
  }, [receivingPhoto])

  const photoStatus = preparingPhoto
    ? 'Preparando a foto…'
    : receivingPhoto
      ? 'Recebendo a foto… aguarde alguns segundos.'
      : null
  const photoStatusLine = photoStatus && (
    <p
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {photoStatus}
    </p>
  )

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
    setReceivingPhoto(false)
    if (selected) onSelectFile(selected)
    e.target.value = ''
  }

  const hiddenInputs = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
      {/* capture="environment": abre a câmera traseira do celular */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
    </>
  )

  const chooser = chooserOpen && (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Adicionar imagem"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={() => setChooserOpen(false)}
    >
      <div
        className="flex w-full max-w-md flex-col gap-2 rounded-t-xl bg-background p-4 pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="pb-1 text-center text-sm font-medium text-foreground">Adicionar imagem</p>
        <Button onClick={() => pickFrom(cameraRef)}>Tirar foto</Button>
        <Button variant="outline" onClick={() => pickFrom(inputRef)}>
          Escolher dos arquivos
        </Button>
        <Button variant="ghost" onClick={() => setChooserOpen(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  )

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
        {photoStatusLine}
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={openPicker}>
            Trocar imagem
          </Button>
          <Button variant="outline" onClick={onRemove}>
            Remover
          </Button>
          <Button onClick={onSearch} disabled={searching}>
            {searching ? 'Pesquisando...' : 'Pesquisar'}
          </Button>
        </div>
        {hiddenInputs}
        {chooser}
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
        {mobile ? 'Tire uma foto ou escolha uma imagem' : 'Arraste uma imagem aqui ou cole com Ctrl+V'}
      </p>
      <p className="text-sm text-muted-foreground">JPG, PNG ou WebP — até 10MB</p>
      <Button variant="outline" size="sm" onClick={openPicker}>
        {mobile ? 'Tirar foto ou escolher imagem' : 'Selecionar arquivo'}
      </Button>
      {photoStatusLine}
      {hiddenInputs}
      {chooser}
    </div>
  )
}
