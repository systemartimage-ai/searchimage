import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
