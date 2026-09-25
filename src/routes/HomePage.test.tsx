import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '@/domains/auth/context'
import { HomePage } from './HomePage'

// HomePage -> Header -> '@/lib/supabase', que lança erro se as env vars
// do Supabase não estiverem definidas (é o comportamento correto em
// produção, mas em CI/teste essas variáveis não existem). Mockamos o
// módulo para isolar o teste de UI da configuração de ambiente.
vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { signOut: vi.fn() } },
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
        <HomePage />
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
    expect(screen.getByText('Catálogo Indexado')).toBeInTheDocument()
    expect(screen.getByText('Diretório Local')).toBeInTheDocument()
  })

  it('rejeita arquivo com formato não suportado (soltado via drag-and-drop)', async () => {
    renderHomePage()

    // O <input accept="image/*"> filtra tipos inválidos no picker do SO,
    // então para testar a validação manual (que também cobre drag-and-drop,
    // onde `accept` não se aplica) simulamos o drop diretamente.
    const dropzone = screen.getByText(/arraste uma imagem/i).closest('[role=button]')!
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

    // 20 itens em REAL_CATALOG_SAMPLE, Top 10 por padrão.
    const cards = screen.getAllByRole('button', { name: /copiar código/i })
    expect(cards.length).toBeLessThanOrEqual(10)
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
