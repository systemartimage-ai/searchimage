import { describe, expect, it } from 'vitest'
import { splitTagKeywords } from './searchCatalog'

// Achado real: item "VALES CARTOGRÁFICOS" (mme088a-118173-1361) é
// visivelmente um quadro, mas ficou sem a tag 'quadro' por margem
// abaixo do limiar de confiança em classifyTipoByPrototype.ts. Exigir
// a tag presente (`tags @> tag_keywords`) tornava o item invisível em
// qualquer busca classificada como 'quadro'. splitTagKeywords isola a
// lógica que resolve isso: espelho/quadro viram EXCLUSÃO do tipo
// oposto, não exigência do tipo certo.
describe('splitTagKeywords', () => {
  it('busca por "quadro" exclui espelho em vez de exigir quadro presente', () => {
    expect(splitTagKeywords(['quadro'])).toEqual({ requireTags: [], excludeTags: ['espelho'] })
  })

  it('busca por "espelho" exclui quadro em vez de exigir espelho presente', () => {
    expect(splitTagKeywords(['espelho'])).toEqual({ requireTags: [], excludeTags: ['quadro'] })
  })

  it('tags aditivas (tema/cor/animal) continuam exigidas normalmente', () => {
    expect(splitTagKeywords(['leao'])).toEqual({ requireTags: ['leao'], excludeTags: [] })
  })

  it('combina tipo (exclusão) com tag aditiva (exigência) ao mesmo tempo', () => {
    expect(splitTagKeywords(['quadro', 'leao'])).toEqual({
      requireTags: ['leao'],
      excludeTags: ['espelho'],
    })
  })

  it('sem nenhuma tag de tipo, não exclui nada', () => {
    expect(splitTagKeywords(['dourado', 'geometrico'])).toEqual({
      requireTags: ['dourado', 'geometrico'],
      excludeTags: [],
    })
  })
})
