import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ODATA_QA   = 'https://sonaemcapitest.nextbitt.net/odata'
const ODATA_PROD = 'https://sonaemcapi.nextbitt.net/odata'

function getBase() {
  return process.env.NEXTBITT_ENV === 'prod' ? ODATA_PROD : ODATA_QA
}

function getHeaders() {
  const token = process.env.NEXTBITT_TOKEN
  if (!token) throw new Error('Token Nextbitt não configurado.')
  return { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
}

const SITUACOES: Record<string, string> = {
  '01': 'Pedido', '02': 'Aprovado', '03': 'Em execução', '04': 'Suspenso',
  '05': 'Anulado', '06': 'Parcialmente executado', '07': 'Por executar',
  '08': 'Aguarda peças', '09': 'Aguarda terceiros', '10': 'Aguarda aprovação',
  '11': 'Aguarda programação', '12': 'Programado', '13': 'Em curso', '14': 'Fechado',
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

    // Buscar todas as lojas com nextbitt_lo_id
    const { data: lojas } = await supabase
      .from('lojas')
      .select('id, nome, nextbitt_lo_id, codigo')
      .not('nextbitt_lo_id', 'is', null)
      .eq('ativo', true)
      .order('nome')

    if (!lojas || lojas.length === 0) {
      return NextResponse.json({ ots: [], total_lojas: 0 })
    }

    let headers: Record<string, string>
    try { headers = getHeaders() } catch (e: any) {
      return NextResponse.json({ erro: e.message }, { status: 500 })
    }

    const BASE = getBase()

    // Construir filtro OData com todas as lojas (lo_id eq '...' or ...)
    const lojaIds = lojas.map(l => `lo_id eq '${String(l.nextbitt_lo_id).padStart(6, '0')}'`)
    const filtro = `ty_id eq 'MP' and (${lojaIds.join(' or ')})`

    const url = `${BASE}/wo_workord?$filter=${encodeURIComponent(filtro)}&$select=wo_id,wo_work,lo_id,xx_sit,wo_schd_dt,wo_dateend,xx_descrip&$orderby=wo_schd_dt`
    const res = await fetch(url, { headers })

    if (!res.ok) {
      return NextResponse.json({ erro: `Erro Nextbitt HTTP ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    const ots: any[] = data.value ?? []

    // Mapa lo_id → loja Signum
    const mapaLojas: Record<string, any> = {}
    for (const l of lojas) {
      const loId = String(l.nextbitt_lo_id).padStart(6, '0')
      mapaLojas[loId] = l
    }

    const resultado = ots.map(o => {
      const loId = o.lo_id?.trim()
      const loja = mapaLojas[loId] ?? null
      const dataPlan = o.wo_schd_dt ? o.wo_schd_dt.slice(0, 10) : null
      const mes = dataPlan ? parseInt(dataPlan.slice(5, 7)) : null
      const semestre = mes ? (mes <= 6 ? 1 : 2) : null
      const ano = dataPlan ? dataPlan.slice(0, 4) : null
      return {
        wo_id: o.wo_id,
        wo_work: o.wo_work,
        lo_id: loId,
        loja_nome: loja?.nome ?? loId,
        loja_codigo: loja?.codigo ?? null,
        loja_id: loja?.id ?? null,
        situacao_codigo: o.xx_sit,
        situacao: SITUACOES[o.xx_sit] ?? o.xx_sit,
        data_planeada: dataPlan,
        data_fecho: o.wo_dateend ? o.wo_dateend.slice(0, 10) : null,
        ano,
        semestre,
        descricao: o.xx_descrip?.trim() ?? null,
      }
    })

    return NextResponse.json({ ots: resultado, total_lojas: lojas.length })
  } catch (err: any) {
    return NextResponse.json({ erro: err.message ?? 'Erro desconhecido.' }, { status: 500 })
  }
}
