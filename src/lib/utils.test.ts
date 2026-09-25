import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('mescla classes e resolve conflitos do Tailwind', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('ignora valores falsy', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b')
  })
})
