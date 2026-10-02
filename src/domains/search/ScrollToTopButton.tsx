import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Só aparece depois de rolar um pouco, para não cobrir a tela de busca.
const SHOW_AFTER_PX = 500

/** Botão fixo "TOPO" com seta: leva a página de volta à busca, no alto. */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <Button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Voltar ao topo da página"
      className="fixed bottom-4 right-4 z-40 gap-1.5 rounded-full px-4 shadow-lg sm:bottom-6 sm:right-6"
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
      TOPO
    </Button>
  )
}
