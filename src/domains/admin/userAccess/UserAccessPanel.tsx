import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useUserAccess } from './useUserAccess'

export function UserAccessPanel() {
  const { users, loading, errorMessage, setRole, currentUserId } = useUserAccess()

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Acesso de usuários</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Todo mundo que se cadastra já pode pesquisar. Aqui você libera ou revoga o acesso à
          ferramenta de upload (Admin) pra cada pessoa.
        </p>

        {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {errorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        {!loading && users.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
        )}

        <div className="flex flex-col gap-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="text-sm text-foreground">{user.email ?? '(sem e-mail)'}</span>
                <span className="text-xs text-muted-foreground">
                  {user.role === 'ADMIN' ? 'Acesso admin' : 'Só consulta'}
                  {user.id === currentUserId ? ' — você' : ''}
                </span>
              </div>
              {user.role === 'ADMIN' ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={user.id === currentUserId}
                  onClick={() => setRole(user.id, 'USER')}
                >
                  Revogar acesso admin
                </Button>
              ) : (
                <Button size="sm" onClick={() => setRole(user.id, 'ADMIN')}>
                  Liberar acesso admin
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
