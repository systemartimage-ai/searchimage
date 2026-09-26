import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArtimageSymbol } from '@/components/ArtimageSymbol'
import { InternalUseBanner } from '@/components/InternalUseBanner'

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Sem token_hash na URL não há nada assíncrono pra esperar (formato
  // antigo #access_token=..., que o próprio cliente Supabase detecta e
  // cria a sessão sozinho) — só fica "não pronto" quando precisa trocar
  // o token_hash por sessão via verifyOtp() no efeito abaixo.
  const [ready, setReady] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return !(params.get('token_hash') && params.get('type') === 'recovery')
  })
  const navigate = useNavigate()

  // O link de recuperação atual do Supabase manda ?token_hash=...&type=recovery
  // na URL. Com token_hash, é preciso trocar explicitamente por uma sessão
  // via verifyOtp() antes de poder chamar updateUser(); sem isso, a chamada
  // sempre falhava com "sessão de autenticação ausente" mesmo com o link
  // certo, porque nenhuma sessão jamais era criada.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenHash = params.get('token_hash')
    const type = params.get('type')
    if (!tokenHash || type !== 'recovery') return

    supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ error }) => {
      if (error) {
        setError('Link de recuperação inválido ou expirado. Solicite um novo.')
      }
      setReady(true)
    })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)

    if (error) {
      setError(
        error.message.includes('Password should be at least')
          ? 'A senha precisa ter pelo menos 6 caracteres.'
          : error.message,
      )
      return
    }
    setDone(true)
    setTimeout(() => navigate('/', { replace: true }), 1500)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <InternalUseBanner />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4">
        <Card className="w-full">
          <CardHeader className="text-center">
            <ArtimageSymbol className="mx-auto mb-2 h-10 w-auto text-foreground" />
            <CardTitle className="font-serif text-3xl italic">Nova senha</CardTitle>
          </CardHeader>
          <CardContent>
            {!ready ? (
              <p className="text-sm text-muted-foreground">Verificando link de recuperação...</p>
            ) : done ? (
              <p role="status" className="text-sm text-muted-foreground">
                Senha atualizada. Redirecionando...
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar nova senha'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
