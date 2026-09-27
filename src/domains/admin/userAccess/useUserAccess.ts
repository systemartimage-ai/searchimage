import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/domains/auth/useAuth'

export interface UserProfile {
  id: string
  email: string | null
  role: 'USER' | 'ADMIN'
  created_at: string
}

async function fetchUsers(): Promise<{ data: UserProfile[] | null; error: boolean }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false })
  return { data, error: Boolean(error) }
}

export function useUserAccess() {
  const { session } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let active = true
    fetchUsers().then(({ data, error }) => {
      if (!active) return
      if (error) setErrorMessage('Não foi possível carregar a lista de usuários.')
      else setUsers(data ?? [])
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [reloadToken])

  const reload = useCallback(() => setReloadToken((t) => t + 1), [])

  const setRole = useCallback(async (userId: string, role: 'USER' | 'ADMIN') => {
    setErrorMessage(null)
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (error) {
      setErrorMessage('Não foi possível atualizar o acesso desse usuário.')
      return
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
  }, [])

  return { users, loading, errorMessage, reload, setRole, currentUserId: session?.user.id }
}
