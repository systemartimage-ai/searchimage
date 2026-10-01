import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '@/domains/auth/context'
import { SearchSessionProvider } from '@/domains/search/SearchSessionProvider'
import { HomePage } from './HomePage'

// HomePage -> Header -> '@/lib/supabase', que lança erro se as env vars
// do Supabase não estiverem definidas (é o comportamento correto em
// produção, mas em CI/teste essas variáveis não existem). Mockamos o
// módulo para isolar o teste de UI da configuração de ambiente.
//
// A busca real agora passa por supabase.rpc('match_catalog_items', ...)
// (ver searchCatalog.ts) — mockamos com uma amostra fixa (mesma forma
// dos dados reais: title/code/category/source/thumbnail_url/score) e
// aplicamos os filtros de categoria/código/nome/limite manualmente, só o
// suficiente pros testes de UI abaixo não dependerem de rede.
const FAKE_ROWS = [
  { id: '1', title: 'EM BUSCA DA PAZ', code: 'ta050a-pend-comp', category: 'Quadros', source: 'Artimage', thumbnail_url: 'a.jpg', score: 1 },
  { id: '2', title: 'TRAMA VIVA', code: 'kj655a-3610-ac', category: 'Colecionáveis', source: 'Artimage', thumbnail_url: 'b.jpg', score: 0.9 },
  { id: '3', title: 'ARTSY', code: 'aty1938a-1361-comp', category: 'Artsy', source: 'Artimage', thumbnail_url: 'c.jpg', score: 0.9 },
  { id: '4', title: 'LEAF', code: 'leaf-55190-ng', category: 'Espelhos', source: 'Artimage', thumbnail_url: 'd.jpg', score: 0.9 },
  { id: '5', title: 'ELM', code: 'elm-100-ng', category: 'Espelhos', source: 'Artimage', thumbnail_url: 'e.jpg', score: 0.85 },
]

// Encadeável genérico pra SourceCards (supabase.from(...).select(...).eq()
// .order().limit().maybeSingle(), ou só await direto no .select()) — os
// testes abaixo não checam o texto que isso alimenta, só não pode
// lançar/rejeitar sem tratamento.
function chainable(): Record<string, unknown> {
  const node: Record<string, unknown> = {
    then: (resolve: (v: { data: null; count: number }) => void) => resolve({ data: null, count: FAKE_ROWS.length }),
  }
  for (const method of ['select', 'eq', 'order', 'limit', 'in', 'abortSignal']) node[method] = () => chainable()
  node.maybeSingle = async () => ({ data: null })
  return node
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { signOut: vi.fn() },
    from: () => chainable(),
    rpc: async (_fn: string, args: { match_category?: string; match_code?: string; match_limit: number }) => {
      const filtered = FAKE_ROWS.filter(
        (r) =>
          (!args.match_category || r.category === args.match_category) &&
          (!args.match_code ||
            r.code.toLowerCase().includes(args.match_code.toLowerCase()) ||
            r.title.toLowerCase().includes(args.match_code.toLowerCase())),
      ).slice(0, args.match_limit)
      return { data: filtered, error: null }
    },
  },
}))

// ClipEmbeddingProvider roda um modelo de IA real (download + inferência):
// não faz sentido em teste de unidade (lento, precisa de rede, e o arquivo
// fake abaixo não é uma imagem válida). Mockamos para retornar um vetor
// fixo de 512 dimensões, mesma dimensão do REAL_CATALOG_SAMPLE.
vi.mock('@/domains/embedding', () => ({
  ClipEmbeddingProvider: class {
    async embedImage() {
      return new Array(512).fill(1 / Math.sqrt(512))
    }
  },
  ClipTextEmbeddingProvider: class {
    async embedText() {
      return new Array(512).fill(1 / Math.sqrt(512))
    }
  },
}))

function renderHomePage() {
  return render(
    <AuthContext.Provider
      value={{
        session: {
          user: { id: 'user-1', email: 'teste@example.com' },
        } as never,
        role: 'USER',
        loading: false,
      }}
    >
      <MemoryRouter>
        <SearchSessionProvider>
          <HomePage />
        </SearchSessionProvider>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

function makeFile(name = 'foto.png', type = 'image/png') {
  return new File([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])], name, { type })
}

describe('HomePage — fluxo de busca (amostra real do catálogo)', () => {
  it('mostra o estado inicial com dropzone e cards de fonte', () => {
    renderHomePage()
    expect(screen.getByText(/arraste uma imagem/i)).toBeInTheDocument()
    // Catálogo Indexado é infraestrutura de backend — não deve aparecer
    // na tela (o usuário não precisa saber que essa fonte existe).
    expect(screen.queryByText('Catálogo Indexado')).not.toBeInTheDocument()
  })

  it('rejeita arquivo com formato não suportado (soltado via drag-and-drop)', async () => {
    renderHomePage()

    // O <input accept="image/*"> filtra tipos inválidos no picker do SO,
    // então para testar a validação manual (que também cobre drag-and-drop,
    // onde `accept` não se aplica) simulamos o drop diretamente.
    const dropzone = screen.getByText(/arraste uma imagem/i).closest('div')!
    const file = makeFile('doc.pdf', 'application/pdf')
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } })

    expect(await screen.findByRole('alert')).toHaveTextContent(/formato não suportado/i)
  })

  it('faz upload, pesquisa e mostra resultados da amostra real do catálogo', async () => {
    const user = userEvent.setup()
    renderHomePage()

    const input = document.querySelector('input[type=file]') as HTMLInputElement
    await user.upload(input, makeFile())

    expect(await screen.findByAltText(/prévia da imagem/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /pesquisar/i }))

    await waitFor(
      () => expect(screen.getByText(/ordenado por similaridade/i)).toBeInTheDocument(),
      {
        timeout: 3000,
      },
    )

    // Mock de supabase.rpc tem 5 linhas fixas (FAKE_ROWS), Top 100 por padrão.
    const cards = screen.getAllByRole('button', { name: /copiar código/i })
    expect(cards.length).toBeLessThanOrEqual(100)
    expect(cards.length).toBeGreaterThan(0)
  })

  it('filtra por categoria depois de uma busca já feita', async () => {
    const user = userEvent.setup()
    renderHomePage()

    const input = document.querySelector('input[type=file]') as HTMLInputElement
    await user.upload(input, makeFile())
    await user.click(screen.getByRole('button', { name: /pesquisar/i }))
    await waitFor(() => screen.getByLabelText(/categoria/i))

    await user.selectOptions(screen.getByLabelText(/categoria/i), 'Espelhos')

    await waitFor(() => {
      // Códigos reais dos itens "Espelhos" em REAL_CATALOG_SAMPLE.
      const codes = screen.getAllByText(/leaf-55190-ng|elm-100-ng|aur-(hor|flu)-\d+-wg/)
      expect(codes.length).toBeGreaterThan(0)
    })
  })

  it('permite trocar e remover a imagem selecionada', async () => {
    const user = userEvent.setup()
    renderHomePage()

    const input = document.querySelector('input[type=file]') as HTMLInputElement
    await user.upload(input, makeFile())
    await screen.findByAltText(/prévia da imagem/i)

    await user.click(screen.getByRole('button', { name: /remover/i }))

    expect(screen.getByText(/arraste uma imagem/i)).toBeInTheDocument()
  })
})
