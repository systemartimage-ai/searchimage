import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UA } from '@/domains/pwa/userAgents'
import { Dropzone } from './Dropzone'

const base = {
  previewUrl: 'blob:foto',
  onSelectFile: vi.fn(),
  onRemove: vi.fn(),
  onSearch: vi.fn(),
  searching: false,
  scanActive: false,
}

describe('Dropzone — etiqueta de acrílico', () => {
  it('mostra "Acrílico (provável)" quando o marcador reconhece a foto', () => {
    render(<Dropzone {...base} looksAcrylic />)
    expect(screen.getByText('Acrílico (provável)')).toBeInTheDocument()
  })

  it('não mostra a etiqueta nas demais fotos', () => {
    render(<Dropzone {...base} looksAcrylic={false} />)
    expect(screen.queryByText('Acrílico (provável)')).toBeNull()
  })

  it('não mostra a etiqueta enquanto a análise está rodando', () => {
    render(<Dropzone {...base} looksAcrylic scanActive />)
    expect(screen.queryByText('Acrílico (provável)')).toBeNull()
  })
})

function setDevice(userAgent: string, touchPoints = 0) {
  Object.defineProperty(window.navigator, 'userAgent', { value: userAgent, configurable: true })
  Object.defineProperty(window.navigator, 'maxTouchPoints', { value: touchPoints, configurable: true })
}

afterEach(() => vi.restoreAllMocks())

describe('Dropzone — selecionar imagem no celular', () => {
  it('celular: o clique abre a escolha entre tirar foto e escolher dos arquivos', async () => {
    setDevice(UA.iphone, 5)
    render(<Dropzone {...base} previewUrl={null} />)
    expect(screen.getByText('Tire uma foto ou escolha uma imagem')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /tirar foto ou escolher imagem/i }))

    const dialog = screen.getByRole('dialog', { name: /adicionar imagem/i })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tirar foto' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Escolher dos arquivos' })).toBeInTheDocument()
  })

  it('"Tirar foto" abre a câmera traseira (capture=environment)', async () => {
    setDevice(UA.android, 5)
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    render(<Dropzone {...base} previewUrl={null} />)

    await userEvent.click(screen.getByRole('button', { name: /tirar foto ou escolher imagem/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Tirar foto' }))

    expect(click).toHaveBeenCalledTimes(1)
    const input = click.mock.contexts[0] as HTMLInputElement
    expect(input.getAttribute('capture')).toBe('environment')
    expect(input.accept).toBe('image/*')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('"Escolher dos arquivos" abre o seletor normal, sem câmera', async () => {
    setDevice(UA.android, 5)
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    render(<Dropzone {...base} previewUrl={null} />)

    await userEvent.click(screen.getByRole('button', { name: /tirar foto ou escolher imagem/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Escolher dos arquivos' }))

    const input = click.mock.contexts[0] as HTMLInputElement
    expect(input.hasAttribute('capture')).toBe(false)
    expect(input.accept).toContain('image/jpeg')
  })

  it('"Cancelar" fecha a escolha sem abrir nada', async () => {
    setDevice(UA.iphone, 5)
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    render(<Dropzone {...base} previewUrl={null} />)

    await userEvent.click(screen.getByRole('button', { name: /tirar foto ou escolher imagem/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(click).not.toHaveBeenCalled()
  })

  it('celular com a foto já escolhida: "Trocar imagem" também oferece a câmera', async () => {
    setDevice(UA.android, 5)
    render(<Dropzone {...base} />)

    await userEvent.click(screen.getByRole('button', { name: 'Trocar imagem' }))

    expect(screen.getByRole('button', { name: 'Tirar foto' })).toBeInTheDocument()
  })

  it('computador: abre direto o seletor de arquivos, sem a escolha', async () => {
    setDevice(UA.windowsChrome, 0)
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    render(<Dropzone {...base} previewUrl={null} />)
    expect(screen.getByText(/arraste uma imagem aqui/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Selecionar arquivo' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(click).toHaveBeenCalledTimes(1)
    expect((click.mock.contexts[0] as HTMLInputElement).hasAttribute('capture')).toBe(false)
  })
})

describe('Dropzone — aviso enquanto a foto chega', () => {
  async function takePhoto(props: Partial<React.ComponentProps<typeof Dropzone>> = {}) {
    setDevice(UA.android, 5)
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    const onSelectFile = vi.fn()
    const view = render(<Dropzone {...base} previewUrl={null} onSelectFile={onSelectFile} {...props} />)
    await userEvent.click(screen.getByRole('button', { name: /tirar foto ou escolher imagem/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Tirar foto' }))
    const camera = view.container.querySelector('input[capture]') as HTMLInputElement
    return { onSelectFile, camera }
  }

  it('depois de tocar em "Tirar foto" avisa que a foto está sendo recebida', async () => {
    await takePhoto()
    expect(screen.getByRole('status')).toHaveTextContent('Recebendo a foto')
  })

  it('o aviso some quando a foto chega', async () => {
    const { onSelectFile, camera } = await takePhoto()
    const photo = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })

    fireEvent.change(camera, { target: { files: [photo] } })

    expect(onSelectFile).toHaveBeenCalledWith(photo)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('o aviso some se o usuário cancela a câmera', async () => {
    const { camera } = await takePhoto()
    fireEvent(camera, new Event('cancel'))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('também avisa ao escolher dos arquivos', async () => {
    setDevice(UA.iphone, 5)
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    render(<Dropzone {...base} previewUrl={null} />)
    await userEvent.click(screen.getByRole('button', { name: /tirar foto ou escolher imagem/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Escolher dos arquivos' }))
    expect(screen.getByRole('status')).toHaveTextContent('Recebendo a foto')
  })

  it('foto grande sendo reduzida: mostra "Preparando a foto"', () => {
    setDevice(UA.android, 5)
    render(<Dropzone {...base} previewUrl={null} preparingPhoto />)
    expect(screen.getByRole('status')).toHaveTextContent('Preparando a foto')
  })

  it('sem foto chegando nem sendo preparada, não mostra aviso', () => {
    setDevice(UA.android, 5)
    render(<Dropzone {...base} previewUrl={null} />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('com a foto já na tela e uma nova sendo recebida, o aviso aparece perto da imagem', async () => {
    setDevice(UA.android, 5)
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    render(<Dropzone {...base} />)
    await userEvent.click(screen.getByRole('button', { name: 'Trocar imagem' }))
    await userEvent.click(screen.getByRole('button', { name: 'Tirar foto' }))
    expect(screen.getByRole('status')).toHaveTextContent('Recebendo a foto')
  })
})
