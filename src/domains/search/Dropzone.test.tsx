import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
