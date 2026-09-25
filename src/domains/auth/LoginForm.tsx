import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Mode = 'sign-in' | 'sign-up'

export function LoginForm() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    if (mode === 'sign-in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setSubmitting(false)
      if (error) {
        setError(traduzErro(error.message))
        return
      }
      navigate(from, { replace: true })
      return
    }

    const { error } = await supabase.auth.signUp({ email, password })
    setSubmitting(false)
    if (error) {
      setError(traduzErro(error.message))
      return
    }
    setInfo('Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.')
    setMode('sign-in')
  }

  async function handleForgotPassword() {
    setError(null)
    setInfo(null)
    if (!email) {
      setError('Digite seu e-mail acima primeiro, depois clique em "Esqueci minha senha".')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(traduzErro(error.message))
      return
    }
    setInfo('Enviamos um link de recuperação para o seu e-mail.')
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
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
      {info && (
        <p role="status" className="text-sm text-muted-foreground">
          {info}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Aguarde...' : mode === 'sign-in' ? 'Entrar' : 'Criar conta'}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
          onClick={() => {
            setError(null)
            setInfo(null)
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
          }}
        >
          {mode === 'sign-in' ? 'Criar uma conta' : 'Já tenho conta'}
        </button>

        {mode === 'sign-in' && (
          <button
            type="button"
            className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
            onClick={handleForgotPassword}
          >
            Esqueci minha senha
          </button>
        )}
      </div>
    </form>
  )
}

function traduzErro(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (message.includes('User already registered')) return 'Já existe uma conta com esse e-mail.'
  if (message.includes('Password should be at least'))
    return 'A senha precisa ter pelo menos 6 caracteres.'
  if (message.includes('rate limit'))
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.'
  if (message.includes('email_address_invalid') || message.includes('is invalid'))
    return 'Esse e-mail não parece válido.'
  return message
}
