import { Link } from 'react-router-dom'
import { Header } from '@/components/Header'
import { BulkUploadPanel } from '@/domains/admin/bulkUpload/BulkUploadPanel'
import { UserAccessPanel } from '@/domains/admin/userAccess/UserAccessPanel'

export function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-6 px-4 py-10">
        <Link to="/" className="self-start text-sm text-muted-foreground hover:text-foreground">
          ← Voltar pra busca
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">Admin</h1>
        <UserAccessPanel />
        <BulkUploadPanel />
      </main>
    </div>
  )
}
