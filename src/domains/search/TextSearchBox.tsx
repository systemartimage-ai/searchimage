import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TextSearchBoxProps {
  onSearch: (text: string) => void
  searching: boolean
}

export function TextSearchBox({ onSearch, searching }: TextSearchBoxProps) {
  const [text, setText] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (text.trim()) onSearch(text.trim())
  }

  return (
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
  )
}
