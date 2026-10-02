import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScrollToTopButton } from './ScrollToTopButton'

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

afterEach(() => scrollTo(0))

describe('ScrollToTopButton', () => {
  it('fica escondido no alto da página', () => {
    render(<ScrollToTopButton />)
    expect(screen.queryByRole('button', { name: /voltar ao topo/i })).toBeNull()
  })

  it('aparece ao rolar e leva a página para o topo ao clicar', async () => {
    const scroll = vi.fn()
    window.scrollTo = scroll as unknown as typeof window.scrollTo
    render(<ScrollToTopButton />)
    scrollTo(1200)

    const button = screen.getByRole('button', { name: /voltar ao topo/i })
    expect(button).toHaveTextContent('TOPO')
    await userEvent.click(button)

    expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('some de novo ao voltar para o alto', () => {
    render(<ScrollToTopButton />)
    scrollTo(1200)
    scrollTo(0)
    expect(screen.queryByRole('button', { name: /voltar ao topo/i })).toBeNull()
  })
})
