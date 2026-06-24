import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ODATA_QA   = 'https://sonaemcapitest.nextbitt.net/odata'
const ODATA_PROD = 'https://sonaemcapi.nextbitt.net/odata'

async function fetchEndpoint(base: string, token: string, path: string, top = 50) {
  try {
    const sep = path.includes('?') ? '&' : '?'
    const res = await fetch(`${base}/${path}${sep}$top=${top}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    })
    if (!res.ok) return { ok: false, status: res.status, erro: `HTTP ${res.status}` }
    const data = await res.json()
    return { ok: true, status: res.status, data: data.value ?? data }
  } catch (e: any) {
    return { ok: false, status: 0, erro: e.message }
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const { token, ambiente } = await req.json()
  const base = ambiente === 'prod' ? ODATA_PROD : ODATA_QA
  const t = token || process.env.NEXTBITT_TOKEN

  if (!t) return NextResponse.json({ erro: 'Token em falta.' }, { status: 400 })

  const endpoints = [
    { key: 'situacoes',   path: 'wo_wostatus', desc: 'Situações (dy_id_stat)' },
    { key: 'equipas',     path: 'wo_trade',    desc: 'Equipas (tr_id)' },
    { key: 'sectores',    path: 'as_sector',   desc: 'Sectores (se_id)' },
    { key: 'localizacoes',path: 'as_locat',    desc: 'Todas as localizações (lo_id)', top: 200 },
    { key: 'lojas_grupos', path: "as_locat?$filter=lo_parent%20eq%20'PT'",    desc: 'Grupos de lojas (filhos de PT)', top: 100 },
    { key: 'lojas_cnt',   path: "as_locat?$filter=lo_parent%20eq%20'PTCNT'", desc: 'Lojas Continente (lo_id individuais)', top: 200 },
    { key: 'lojas_mdl',   path: "as_locat?$filter=lo_parent%20eq%20'PTMDL'", desc: 'Lojas Modelo (lo_id individuais)', top: 200 },
    { key: 'lojas_cbd',   path: "as_locat?$filter=lo_parent%20eq%20'PTCBD'", desc: 'Lojas Bom Dia (lo_id individuais)', top: 200 },
  ]

  const resultados: Record<string, any> = {}
  for (const ep of endpoints) {
    const r = await fetchEndpoint(base, t, ep.path, ep.top ?? 50)
    resultados[ep.key] = { ...r, desc: ep.desc }
  }

  return NextResponse.json({ ambiente: ambiente ?? 'qa', base, resultados })
}
