// Validação SOMENTE LEITURA de uma versão candidata do índice antes de ela substituir a ativa.
// Regra permanente do projeto: o índice ativo nunca é destruído antes de uma nova versão validada.
// Este script NÃO promove, NÃO altera e NÃO apaga nada: só lê e diz "PODE TROCAR" ou "NÃO TROCAR".
//
// Uso:
//   node scripts/validateIndex.mjs                  # compara a ACTIVE com a versão BUILDING/READY mais recente
//   node scripts/validateIndex.mjs --version <id>   # compara a ACTIVE com a versão indicada
//
// Usa SUPABASE_SERVICE_ROLE_KEY (somente aqui, no Node; nunca no navegador). Lê .env.local.

import fs from 'node:fs'

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local')
const URL_BASE = process.env.VITE_SUPABASE_URL
const CHAVE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_BASE || !CHAVE) {
  console.error('Faltam VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.')
  process.exit(2)
}
const H = { apikey: CHAVE, Authorization: `Bearer ${CHAVE}` }

const get = async (caminho, extra = {}) => {
  const r = await fetch(`${URL_BASE}/rest/v1/${caminho}`, { headers: { ...H, ...extra } })
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  return r
}
const contar = async (filtro) => {
  const r = await get(`catalog_items?select=id&${filtro}`, { Prefer: 'count=exact', Range: '0-0' })
  const m = /\/(\d+)$/.exec(r.headers.get('content-range') ?? '')
  return m ? Number(m[1]) : 0
}
async function todosOsIds(versao) {
  const ids = new Map()
  for (let off = 0; ; off += 1000) {
    const r = await get(`catalog_items?select=external_id,image_url,title,metadata&index_version_id=eq.${versao}&active=eq.true`, {
      Range: `${off}-${off + 999}`,
    })
    const lote = await r.json()
    for (const i of lote) ids.set(i.external_id, i)
    if (lote.length < 1000) break
  }
  return ids
}

const arg = process.argv.indexOf('--version')
const versoes = await (await get('index_versions?select=*&order=started_at.desc')).json()
const candidata = arg > -1 ? versoes.find((v) => v.id === process.argv[arg + 1]) : versoes.find((v) => v.status === 'BUILDING' || v.status === 'READY')
if (!candidata) {
  console.log('Não há versão candidata (BUILDING/READY) para validar. Nada a fazer.')
  process.exit(0)
}
// O índice é por FONTE (catálogo web, diretório/upload...): a candidata só se compara com a ACTIVE da mesma fonte.
const ativa = versoes.find((v) => v.status === 'ACTIVE' && v.source_id === candidata.source_id)
if (!ativa) console.log('AVISO: não há versão ACTIVE desta fonte (primeira indexação?). Só dá para validar a candidata isolada.')

const problemas = []
const avisos = []
console.log(`Candidata: ${candidata.id} (${candidata.status}, modelo ${candidata.embedding_model}, dimensão ${candidata.vector_dimension})`)
if (ativa) console.log(`Ativa:     ${ativa.id} (modelo ${ativa.embedding_model}, dimensão ${ativa.vector_dimension})`)

const n = await contar(`index_version_id=eq.${candidata.id}&active=eq.true`)
const nAtiva = ativa ? await contar(`index_version_id=eq.${ativa.id}&active=eq.true`) : 0
console.log(`Itens ativos: candidata ${n} · ativa ${nAtiva}`)
if (n === 0) problemas.push('a candidata não tem nenhum item ativo')
if (ativa && nAtiva > 0 && n < nAtiva * 0.95) problemas.push(`a candidata tem ${n} itens, menos de 95% dos ${nAtiva} da ativa`)
if (ativa && candidata.embedding_model !== ativa.embedding_model) avisos.push(`modelo de embedding diferente (${ativa.embedding_model} → ${candidata.embedding_model}): as buscas não são comparáveis sem reindexar tudo`)
if (ativa && candidata.vector_dimension !== ativa.vector_dimension) problemas.push('dimensão do vetor diferente da ativa')

const semVetor = await contar(`index_version_id=eq.${candidata.id}&active=eq.true&embedding=is.null`)
if (semVetor > 0) problemas.push(`${semVetor} itens sem vetor (embedding nulo)`)

const itens = await todosOsIds(candidata.id)
let semTitulo = 0, semImagem = 0, semCodigo = 0
for (const i of itens.values()) {
  if (!i.title) semTitulo++
  if (!i.image_url) semImagem++
  if (!i.metadata?.code) semCodigo++
}
if (semTitulo) avisos.push(`${semTitulo} itens sem título`)
if (semImagem) problemas.push(`${semImagem} itens sem imagem`)
if (semCodigo) avisos.push(`${semCodigo} itens sem código do produto`)

if (ativa) {
  const daAtiva = await todosOsIds(ativa.id)
  const sumiram = [...daAtiva.keys()].filter((k) => !itens.has(k))
  const novos = [...itens.keys()].filter((k) => !daAtiva.has(k))
  console.log(`Produtos que sumiram: ${sumiram.length} · novos: ${novos.length}`)
  if (sumiram.length > daAtiva.size * 0.05) problemas.push(`${sumiram.length} produtos da ativa sumiram (mais de 5%)`)
  else if (sumiram.length > 0) avisos.push(`${sumiram.length} produtos da ativa não estão na candidata (exemplos: ${sumiram.slice(0, 5).join(', ')})`)
}

console.log('')
for (const a of avisos) console.log('  aviso:', a)
for (const p of problemas) console.log('  PROBLEMA:', p)
console.log(problemas.length === 0 ? '\nRESULTADO: PODE TROCAR (nenhum problema nas verificações acima). Quem promove a versão é você.' : '\nRESULTADO: NÃO TROCAR.')
console.log('Obs.: não testa a qualidade das buscas; para isso use o agente testador-busca com as buscas fixas.')
process.exit(problemas.length === 0 ? 0 : 1)
