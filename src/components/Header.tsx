import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/domains/auth/useAuth'
import { Button } from '@/components/ui/button'

export function Header() {
  const { session, role } = useAuth()

  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-3">
      <Link to="/" className="font-semibold tracking-tight text-foreground">
        Search Image
      </Link>

      <div className="flex items-center gap-4 text-sm">
        {session && (
          <span className="hidden text-muted-foreground sm:inline">{session.user.email}</span>
        )}
        {role === 'ADMIN' && (
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            Admin
          </Link>
        )}
        {session && (
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
            Sair
          </Button>
        )}
      </div>
    </header>
  )
}
