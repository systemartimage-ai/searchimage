import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type Role = 'USER' | 'ADMIN'

export interface AuthState {
  session: Session | null
  role: Role | null
  loading: boolean
}

export const AuthContext = createContext<AuthState | undefined>(undefined)
