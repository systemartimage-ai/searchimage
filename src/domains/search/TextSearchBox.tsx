import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScanOverlay } from './ScanOverlay'

interface TextSearchBoxProps {
  onSearch: (text: string) => void
  /** Desabilita os controles enquanto QUALQUER busca roda (imagem ou texto). */
  searching: boolean
  /** Mostra o overlay de scan só quando a busca em andamento foi disparada por ESTA caixa. */
  scanActive: boolean
  /** Texto do overlay de scan enquanto `scanActive` é true (ex.: etapa atual do pipeline). */
  scanLabel?: string
}

export function TextSearchBox({ onSearch, searching, scanActive, scanLabel }: TextSearchBoxProps) {
  const [text, setText] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (text.trim()) onSearch(text.trim())
  }

  return (
    <div className="relative">
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-border px-6 py-16 text-center"
      >
        <p className="text-lg font-medium text-foreground">Qual o tema da imagem você procura?</p>
        <p className="text-sm text-muted-foreground">
          Descreva com suas palavras — a IA busca em todo o catálogo pelo que mais combina.
        </p>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="ex.: um espelho redondo, quadro com paisagem..."
          disabled={searching}
          className="max-w-xs"
        />
        <Button type="submit" disabled={searching || !text.trim()}>
          {searching ? 'Buscando...' : 'Buscar'}
        </Button>
      </form>
      {scanActive && <ScanOverlay label={scanLabel ?? 'Analisando com IA...'} />}
    </div>
  )
}
