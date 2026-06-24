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
    { key: 'pedidos_recentes', path: 'wo_request', desc: 'Pedidos (wo_request)', top: 20 },
    { key: 'pedido_243718', path: "wo_request(243718)", desc: 'Pedido re_id=243718 (visita exportada)', top: 1 },
    { key: 'situacoes',   path: 'wo_wostatus', desc: 'Situações (dy_id_stat)' },
    { key: 'equipas',     path: 'wo_trade',    desc: 'Equipas (tr_id)' },
    { key: 'sectores',    path: 'as_sector',   desc: 'Sectores (se_id)' },
    { key: 'localizacoes',path: 'as_locat',    desc: 'Todas as localizações (lo_id)', top: 200 },
    { key: 'lojas_grupos',  path: "as_locat?$filter=lo_parent%20eq%20'PT'",     desc: 'Grupos de lojas (filhos de PT)',          top: 100 },
    { key: 'lojas_cnt',    path: "as_locat?$filter=lo_parent%20eq%20'PTCNT'",  desc: 'DOPs Continente',                         top: 50  },
    { key: 'lojas_cnt1',   path: "as_locat?$filter=lo_parent%20eq%20'PTCNT1'", desc: 'Continente Norte (lojas individuais)',     top: 200 },
    { key: 'lojas_cnt5',   path: "as_locat?$filter=lo_parent%20eq%20'PTCNT5'", desc: 'Continente Sul (lojas individuais)',       top: 200 },
    { key: 'lojas_mdl',    path: "as_locat?$filter=lo_parent%20eq%20'PTMDL'",  desc: 'DOPs Modelo',                             top: 50  },
    { key: 'lojas_mdl1',   path: "as_locat?$filter=lo_parent%20eq%20'PTMDL1'", desc: 'Modelo Norte (lojas individuais)',         top: 200 },
    { key: 'lojas_mdl2',   path: "as_locat?$filter=lo_parent%20eq%20'PTMDL2'", desc: 'Modelo Centro Norte (lojas individuais)', top: 200 },
    { key: 'lojas_mdl4',   path: "as_locat?$filter=lo_parent%20eq%20'PTMDL4'", desc: 'Modelo Centro Sul (lojas individuais)',   top: 200 },
    { key: 'lojas_mdl5',   path: "as_locat?$filter=lo_parent%20eq%20'PTMDL5'", desc: 'Modelo Sul (lojas individuais)',          top: 200 },
    { key: 'lojas_cbd',    path: "as_locat?$filter=lo_parent%20eq%20'PTCBD'",  desc: 'DOPs Bom Dia',                            top: 50  },
    { key: 'lojas_cbd1',   path: "as_locat?$filter=lo_parent%20eq%20'PTCBD1'", desc: 'Bom Dia Norte (lojas individuais)',       top: 200 },
    { key: 'lojas_cbd3',   path: "as_locat?$filter=lo_parent%20eq%20'PTCBD3'", desc: 'Bom Dia Centro (lojas individuais)',      top: 200 },
    { key: 'lojas_cbd5',   path: "as_locat?$filter=lo_parent%20eq%20'PTCBD5'", desc: 'Bom Dia Sul (lojas individuais)',         top: 200 },
  ]

  const resultados: Record<string, any> = {}
  for (const ep of endpoints) {
    const r = await fetchEndpoint(base, t, ep.path, ep.top ?? 50)
    resultados[ep.key] = { ...r, desc: ep.desc }
  }

  return NextResponse.json({ ambiente: ambiente ?? 'qa', base, resultados })
}
