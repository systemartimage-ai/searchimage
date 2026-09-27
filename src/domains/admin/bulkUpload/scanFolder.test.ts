import { describe, expect, it } from 'vitest'
import { groupByTopLevel, scanDirectory } from './scanFolder'

// Fake mínimo de FileSystemDirectoryHandle/FileSystemFileHandle — só o
// suficiente pra exercitar a recursão (.values()/.kind/.name), sem
// precisar de um navegador real (File System Access API não existe em
// jsdom/happy-dom).
interface FakeEntry {
  kind: 'file' | 'directory'
  name: string
}

function fakeFile(name: string): FakeEntry {
  return { kind: 'file', name }
}

function fakeDir(name: string, children: FakeEntry[]) {
  return {
    kind: 'directory' as const,
    name,
    async *values() {
      for (const child of children) yield child
    },
  }
}

function buildTestTree() {
  return fakeDir('Fotos', [
    fakeFile('root1.jpg'),
    fakeFile('ignore.txt'),
    fakeDir('Quadros', [
      fakeFile('a.jpg'),
      fakeDir('Sub', [fakeFile('b.png')]),
    ]),
    fakeDir('Espelhos', [fakeFile('c.webp')]),
  ])
}

describe('scanDirectory', () => {
  it('caminha recursivamente e filtra por extensão aceita', async () => {
    const root = buildTestTree()
    const entries = await scanDirectory(root as unknown as FileSystemDirectoryHandle)

    const paths = entries.map((e) => e.relativePath).sort()
    expect(paths).toEqual(['Espelhos/c.webp', 'Quadros/Sub/b.png', 'Quadros/a.jpg', 'root1.jpg'])
  })

  it('soma sub-subpastas na subpasta de primeiro nível, e marca arquivos da raiz com grupo vazio', async () => {
    const root = buildTestTree()
    const entries = await scanDirectory(root as unknown as FileSystemDirectoryHandle)

    const byPath = Object.fromEntries(entries.map((e) => [e.relativePath, e.topLevelGroup]))
    expect(byPath['root1.jpg']).toBe('')
    expect(byPath['Quadros/a.jpg']).toBe('Quadros')
    expect(byPath['Quadros/Sub/b.png']).toBe('Quadros')
    expect(byPath['Espelhos/c.webp']).toBe('Espelhos')
  })
})

describe('groupByTopLevel', () => {
  it('agrupa por subpasta de primeiro nível, raiz primeiro, resto alfabético', () => {
    const groups = groupByTopLevel([
      { topLevelGroup: '' },
      { topLevelGroup: 'Quadros' },
      { topLevelGroup: 'Quadros' },
      { topLevelGroup: 'Espelhos' },
    ])

    expect(groups).toEqual([
      { key: '', label: 'Arquivos na raiz da pasta', fileCount: 1 },
      { key: 'Espelhos', label: 'Espelhos', fileCount: 1 },
      { key: 'Quadros', label: 'Quadros', fileCount: 2 },
    ])
  })

  it('retorna lista vazia pra entrada vazia', () => {
    expect(groupByTopLevel([])).toEqual([])
  })
})
