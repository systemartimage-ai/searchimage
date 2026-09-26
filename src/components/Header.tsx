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
      <header className="flex items-center justify-between border-t border-white/10 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <ArtimageSymbol className="h-6 w-auto text-[#f5f3ef]" />
          <span className="font-serif text-lg italic tracking-tight">Search Image</span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
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
