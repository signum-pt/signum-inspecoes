import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ODATA_QA   = 'https://sonaemcapitest.nextbitt.net/odata'
const ODATA_PROD = 'https://sonaemcapi.nextbitt.net/odata'

function getBase() {
  return process.env.NEXTBITT_ENV === 'prod' ? ODATA_PROD : ODATA_QA
}

function getHeaders() {
  const token = process.env.NEXTBITT_TOKEN
  if (!token) throw new Error('Token Nextbitt não configurado (NEXTBITT_TOKEN).')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}

async function extrairErroNextbitt(res: Response, contexto: string): Promise<string> {
  const statusMensagem: Record<number, string> = {
    400: 'Pedido inválido — verifique os dados enviados.',
    401: 'Token inválido ou expirado.',
    404: 'Recurso não encontrado no Nextbitt.',
    409: 'Conflito — já existe um registo com este pedido.',
  }
  let detalhe = ''
  try {
    const body = await res.json()
    detalhe = body?.['odata.error']?.message?.value ?? ''
  } catch { /* não é JSON */ }
  const descricao = statusMensagem[res.status]
    ?? (res.status >= 500 ? `Erro interno Nextbitt (${res.status}).` : `Erro ${res.status}.`)
  return detalhe ? `${contexto}: ${descricao}\nDetalhe: ${detalhe}` : `${contexto}: ${descricao}`
}

export async function POST(req: NextRequest) {
  try {
    const { visita_id } = await req.json()
    if (!visita_id) return NextResponse.json({ erro: 'Parâmetro visita_id em falta.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

    const { data: visita } = await supabase
      .from('visitas')
      .select('*, lojas(nome, nextbitt_lo_id), profiles(nome), templates(nome)')
      .eq('id', visita_id)
      .single()

    if (!visita) return NextResponse.json({ erro: 'Visita não encontrada.' }, { status: 404 })
    if (visita.nextbitt_id) return NextResponse.json({ erro: 'Esta visita já foi exportada para o Nextbitt.' }, { status: 409 })
    if (!visita.lojas?.nextbitt_lo_id) {
      return NextResponse.json({ erro: 'A loja não tem código Nextbitt (lo_id) configurado.' }, { status: 400 })
    }

    let headers: Record<string, string>
    try { headers = getHeaders() } catch (e: any) {
      return NextResponse.json({ erro: e.message }, { status: 500 })
    }

    const BASE = getBase()
    const logs: string[] = []
    const log = (msg: string) => { console.log('[Nextbitt]', msg); logs.push(msg) }

    log(`Ambiente: ${process.env.NEXTBITT_ENV ?? 'qa (default)'} → ${BASE}`)
    log(`Visita: ${visita_id}`)
    log(`Loja: ${visita.lojas?.nome} (lo_id: ${visita.lojas?.nextbitt_lo_id})`)
    log(`Técnico: ${visita.profiles?.nome}`)
    log(`Template: ${visita.templates?.nome}`)
    log(`PDF assinado: ${visita.pdf_assinado_url ? 'sim' : 'não'}`)

    const dataVisita = new Date(visita.data_visita + 'T12:00:00').toISOString()
    const descricao = `${visita.templates?.nome ?? 'Inspeção'} — ${visita.lojas?.nome}`
    const observacoes = [
      visita.observacoes_gerais ? `Obs: ${visita.observacoes_gerais}` : null,
      `Técnico: ${visita.profiles?.nome ?? ''}`,
    ].filter(Boolean).join('\n')

    const payload = {
      xx_datep: dataVisita,
      lo_id: visita.lojas.nextbitt_lo_id,
      xx_descrip: descricao.slice(0, 100),
      dy_id_stat: '01',
      re_requestedby: visita.profiles?.nome ?? '',
      xx_obs: observacoes,
      re_extref: visita_id.slice(0, 30),
    }
    log(`Payload wo_request: ${JSON.stringify(payload)}`)

    // Criar Pedido de Intervenção
    let pedidoRes: Response
    try {
      pedidoRes = await fetch(`${BASE}/wo_request`, { method: 'POST', headers, body: JSON.stringify(payload) })
    } catch (e: any) {
      return NextResponse.json({ erro: `Erro de rede: ${e?.message ?? 'desconhecido'}`, logs }, { status: 502 })
    }

    log(`Resposta wo_request: HTTP ${pedidoRes.status}`)

    if (!pedidoRes.ok) {
      const msg = await extrairErroNextbitt(pedidoRes, 'Criação do pedido')
      log(`ERRO: ${msg}`)
      return NextResponse.json({ erro: msg, logs }, { status: 502 })
    }

    let pedido: any
    try { pedido = await pedidoRes.json() } catch {
      return NextResponse.json({ erro: 'Pedido criado mas resposta ilegível.', logs }, { status: 502 })
    }
    const nextbittId = pedido.re_id ?? pedido.value ?? String(Date.now())
    log(`Pedido criado: re_id=${nextbittId}, resposta=${JSON.stringify(pedido).slice(0, 200)}`)

    // Upload do PDF assinado (se existir)
    let avisoUpload = ''
    if (visita.pdf_assinado_url) {
      log('A fazer upload do PDF...')
      try {
        const pdfRes = await fetch(visita.pdf_assinado_url)
        if (pdfRes.ok) {
          const pdfBase64 = Buffer.from(await pdfRes.arrayBuffer()).toString('base64')
          log(`PDF obtido (${Math.round(pdfBase64.length / 1024)}KB base64), a enviar para cf_imalink...`)
          const uploadRes = await fetch(`${BASE}/cf_imalink`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              us_prof: String(nextbittId),
              xx_type: 'wo_request',
              us_shtname: `relatorio_${visita_id.slice(0, 20)}.pdf`,
              xx_desc: `PDF Relatório — ${descricao.slice(0, 80)}`,
              co_id: 'PDF',
              cf_actiontype: '0',
              cf_base64: pdfBase64,
              us_private: false,
            }),
          })
          log(`Resposta cf_imalink: HTTP ${uploadRes.status}`)
          if (!uploadRes.ok) {
            avisoUpload = await extrairErroNextbitt(uploadRes, 'Upload do PDF')
            log(`AVISO upload: ${avisoUpload}`)
          } else {
            log('PDF anexado com sucesso.')
          }
        } else {
          log(`Não foi possível obter o PDF: HTTP ${pdfRes.status}`)
        }
      } catch (e: any) {
        avisoUpload = `PDF não anexado: ${e?.message ?? 'erro de rede'}`
        log(`ERRO upload: ${avisoUpload}`)
      }
    } else {
      log('Sem PDF assinado — a ignorar upload.')
    }

    await supabase.from('visitas').update({
      nextbitt_id: String(nextbittId),
      nextbitt_exportado_em: new Date().toISOString(),
    }).eq('id', visita_id)
    log('Visita actualizada no Supabase com nextbitt_id.')

    return NextResponse.json({ ok: true, nextbitt_id: nextbittId, aviso: avisoUpload || undefined, logs })
  } catch (err: any) {
    console.error('[Nextbitt] Erro inesperado:', err?.message)
    return NextResponse.json({ erro: err.message ?? 'Erro desconhecido.' }, { status: 500 })
  }
}
