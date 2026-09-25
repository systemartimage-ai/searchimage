import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Falha alto e cedo: melhor um erro claro no boot do que uma query silenciosamente quebrada.
  throw new Error(
    'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja .env.example).',
  )
}

// Único ponto de criação do client no front-end. Usa exclusivamente a anon key:
// a segurança de leitura/escrita é garantida pelas RLS policies no banco, nunca por esta chave.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
