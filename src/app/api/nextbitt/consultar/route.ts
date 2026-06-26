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
    const { searchParams } = new URL(req.url)
    const visita_id = searchParams.get('visita_id')
    if (!visita_id) return NextResponse.json({ erro: 'Parâmetro visita_id em falta.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

    const { data: visita } = await supabase
      .from('visitas')
      .select('nextbitt_id, nextbitt_wo_work, nextbitt_exportado_em, lojas(nome, nextbitt_lo_id), data_visita')
      .eq('id', visita_id)
      .single()

    if (!visita) return NextResponse.json({ erro: 'Visita não encontrada.' }, { status: 404 })
    if (!visita.nextbitt_id) return NextResponse.json({ erro: 'Esta visita ainda não foi exportada para o Nextbitt.' }, { status: 400 })

    const woId = visita.nextbitt_id
    const woWork = visita.nextbitt_wo_work ?? 1
    let headers: Record<string, string>
    try { headers = getHeaders() } catch (e: any) {
      return NextResponse.json({ erro: e.message }, { status: 500 })
    }

    const BASE = getBase()

    // 1. Estado da OT
    const otRes = await fetch(
      `${BASE}/wo_workord?$filter=wo_id eq ${woId}&$select=wo_id,wo_work,xx_sit,wo_dateend,xx_descrip,xx_dscwork,imalink_quantity,lo_id,wo_schd_dt`,
      { headers }
    )
    if (!otRes.ok) return NextResponse.json({ erro: `Erro ao consultar OT (HTTP ${otRes.status}).` }, { status: 502 })
    const otData = await otRes.json()
    const ot = otData.value?.[0]
    if (!ot) return NextResponse.json({ erro: 'OT não encontrada no Nextbitt.' }, { status: 404 })

    // 2. Todas as OTs MP da mesma loja (para ver ambos os semestres)
    const lojaId = (visita.lojas as any)?.nextbitt_lo_id
    let ots_loja: any[] = []
    if (lojaId) {
      const lo_id_padded = String(lojaId).padStart(6, '0')
      const siblingsRes = await fetch(
        `${BASE}/wo_workord?$filter=ty_id eq 'MP' and lo_id eq '${lo_id_padded}'&$select=wo_id,wo_work,xx_sit,wo_schd_dt,xx_descrip&$orderby=wo_schd_dt`,
        { headers }
      )
      if (siblingsRes.ok) {
        ots_loja = (await siblingsRes.json()).value ?? []
      }
    }

    // 3. Checklist completo com recurso
    const chkUrl = `${BASE}/pm_jobchs?$filter=wo_id eq ${woId}&$select=pm_task,pm_state_name,pm_obs,xx_rela,xx_dt_rec,xx_respexc&$orderby=xx_seq`
    const chkRes = await fetch(chkUrl, { headers })
    const chkBody = chkRes.ok ? await chkRes.json() : null
    const checklist = chkBody?.value ?? []
    console.log(`[consultar] pm_jobchs HTTP ${chkRes.status} | url: ${chkUrl} | items: ${checklist.length} | raw keys: ${chkBody ? Object.keys(chkBody).join(',') : 'n/a'}`)

    const nok = checklist.filter((c: any) => c.pm_state_name === 'NOK').length
    const ok = checklist.filter((c: any) => c.pm_state_name === 'OK').length
    const na = checklist.filter((c: any) => c.pm_state_name === 'Sem Aplicacao').length
    const vazios = checklist.filter((c: any) => !c.pm_state_name).length

    return NextResponse.json({
      _debug_checklist: { http: chkRes.status, url: chkUrl, items: checklist.length, raw_keys: chkBody ? Object.keys(chkBody) : [] },
      ot: {
        wo_id: ot.wo_id,
        wo_work: ot.wo_work,
        loja: ot.lo_id?.trim(),
        situacao_codigo: ot.xx_sit,
        situacao_descricao: SITUACOES[ot.xx_sit] ?? ot.xx_sit,
        data_planeada: ot.wo_schd_dt ? ot.wo_schd_dt.slice(0, 10) : null,
        data_fecho: ot.wo_dateend ?? null,
        descricao: ot.xx_descrip?.trim() ?? null,
        descricao_trabalho: ot.xx_dscwork?.trim() ?? null,
        anexos: ot.imalink_quantity ?? 0,
      },
      resumo_checklist: { ok, nok, na, vazios, total: checklist.length },
      checklist: checklist.map((c: any) => ({
        tarefa: c.pm_task,
        estado: c.pm_state_name ?? null,
        notas: c.pm_obs?.trim() ?? null,
        notas_rela: c.xx_rela?.trim() ?? null,
        data: c.xx_dt_rec ? c.xx_dt_rec.slice(0, 10) : null,
        recurso: c.xx_respexc ?? null,
      })),
      exportado_em: visita.nextbitt_exportado_em,
      ots_loja: ots_loja.map((o: any) => ({
        wo_id: o.wo_id,
        wo_work: o.wo_work,
        situacao_codigo: o.xx_sit,
        situacao_descricao: SITUACOES[o.xx_sit] ?? o.xx_sit,
        data_planeada: o.wo_schd_dt ? o.wo_schd_dt.slice(0, 10) : null,
        esta_ot: o.wo_id === woId,
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ erro: err.message ?? 'Erro desconhecido.' }, { status: 500 })
  }
}
