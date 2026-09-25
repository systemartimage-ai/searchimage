import { Header } from '@/components/Header'

export function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Admin</h1>
        <p className="text-muted-foreground">
          Painel administrativo (fontes, indexação, versões) chega na Fase 6.
        </p>
      </main>
    </div>
  )
}
