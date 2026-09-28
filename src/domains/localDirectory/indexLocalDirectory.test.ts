import { describe, expect, it, vi } from 'vitest'
import { walkImageFiles } from './indexLocalDirectory'

// Fake mínimo de FileSystemDirectoryHandle/FileSystemFileHandle — mesmo
// padrão de src/domains/admin/bulkUpload/scanFolder.test.ts. O ponto
// principal deste teste: getFile() NUNCA deve ser chamado em arquivo
// que não bate a extensão aceita (era exatamente isso que deixava
// pastas grandes travadas em "Indexando... 0" sem progresso nenhum).
interface FakeFileEntry {
  kind: 'file'
  name: string
  getFile: () => Promise<File>
}
interface FakeDirEntry {
  kind: 'directory'
  name: string
  values(): AsyncGenerator<FakeFileEntry | FakeDirEntry>
}
type FakeEntry = FakeFileEntry | FakeDirEntry

function fakeFile(name: string): FakeFileEntry {
  const getFile = vi.fn(async () => ({ name, type: 'image/jpeg' }) as unknown as File)
  return { kind: 'file', name, getFile }
}

function fakeDir(name: string, children: FakeEntry[]): FakeDirEntry {
  return {
    kind: 'directory' as const,
    name,
    async *values() {
      for (const child of children) yield child
    },
  }
}

describe('walkImageFiles', () => {
  it('so abre (getFile) arquivos com extensao aceita', async () => {
    const txt = fakeFile('notas.txt')
    const jpg = fakeFile('foto.jpg')
    const root = fakeDir('Pasta', [txt, jpg])

    const results = []
    for await (const file of walkImageFiles(root as unknown as FileSystemDirectoryHandle, true)) {
      results.push(file)
    }

    expect(results).toHaveLength(1)
    expect(txt.getFile).not.toHaveBeenCalled()
    expect(jpg.getFile).toHaveBeenCalledTimes(1)
  })

  it('desce em subpastas quando includeSubfolders é true', async () => {
    const inner = fakeFile('interna.png')
    const sub = fakeDir('Sub', [inner])
    const root = fakeDir('Pasta', [sub])

    const results = []
    for await (const file of walkImageFiles(root as unknown as FileSystemDirectoryHandle, true)) {
      results.push(file)
    }
    expect(results).toHaveLength(1)
  })

  it('ignora subpastas quando includeSubfolders é false', async () => {
    const inner = fakeFile('interna.png')
    const sub = fakeDir('Sub', [inner])
    const topLevel = fakeFile('raiz.jpg')
    const root = fakeDir('Pasta', [sub, topLevel])

    const results = []
    for await (const file of walkImageFiles(root as unknown as FileSystemDirectoryHandle, false)) {
      results.push(file)
    }
    expect(results).toHaveLength(1)
    expect(inner.getFile).not.toHaveBeenCalled()
  })

  it('aceita extensao em caixa alta', async () => {
    const jpg = fakeFile('FOTO.JPG')
    const root = fakeDir('Pasta', [jpg])

    const results = []
    for await (const file of walkImageFiles(root as unknown as FileSystemDirectoryHandle, true)) {
      results.push(file)
    }
    expect(results).toHaveLength(1)
  })
})
