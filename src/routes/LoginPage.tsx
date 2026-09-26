import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/domains/auth/LoginForm'
import { ArtimageSymbol } from '@/components/ArtimageSymbol'
import { InternalUseBanner } from '@/components/InternalUseBanner'

export function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <InternalUseBanner />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4">
        <Card className="w-full">
          <CardHeader className="text-center">
            <ArtimageSymbol className="mx-auto mb-2 h-10 w-auto text-foreground" />
            <CardTitle className="font-serif text-3xl italic">Search Image</CardTitle>
            <p className="text-sm text-muted-foreground">Entre para pesquisar por imagem</p>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
