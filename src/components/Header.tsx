import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/domains/auth/useAuth'
import { Button } from '@/components/ui/button'
import { ArtimageSymbol } from '@/components/ArtimageSymbol'
import { InternalUseBanner } from '@/components/InternalUseBanner'

export function Header() {
  const { session, role } = useAuth()

  return (
    // Fundo sempre preto (independente do tema claro/escuro do resto do
    // app) — é a identidade fixa da marca, não a paleta de conteúdo.
    <div className="bg-[#0e0d0b] text-[#f5f3ef]">
      <InternalUseBanner />
      <header className="grid grid-cols-[1fr_auto_1fr] items-center border-t border-white/10 px-4 py-3 sm:px-6">
        <div />

        <a
          href="https://www.artimage.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center"
        >
          <ArtimageSymbol className="h-9 w-auto text-[#f5f3ef]" />
        </a>

        <div className="flex items-center justify-end gap-4 text-sm">
          {session && <span className="hidden text-white/60 sm:inline">{session.user.email}</span>}
          {role === 'ADMIN' && (
            <Link to="/admin" className="text-white/60 hover:text-white">
              Admin
            </Link>
          )}
          {session && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => supabase.auth.signOut()}
            >
              Sair
            </Button>
          )}
        </div>
      </header>
    </div>
  )
}
