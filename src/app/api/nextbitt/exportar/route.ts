import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ODATA_QA   = 'https://sonaemcapitest.nextbitt.net/odata'
const ODATA_PROD = 'https://sonaemcapi.nextbitt.net/odata'

// Mapeamento: pm_task Nextbitt → { chave do valor OK/NOK, chave das notas }
const MAPA_VERIFICACOES: Record<string, { valor: string; notas?: string }> = {
  'Verificação Terras Proteção':               { valor: 'terras_pt' },
  'Verificação Salas Técnicas':                { valor: 'salas_tecnicas',                   notas: 'observacoes_salas_tecnicas' },
  'Verificação Posto Transformação':           { valor: 'tem_pt',                           notas: 'observacoes_pt' },
  'Verificação Gerador':                       { valor: 'tem_gerador_seguranca',             notas: 'observacoes_grupos_geradores' },
  'Verificação Carport':                       { valor: 'quadro_carport',                   notas: 'observacoes_carport' },
  'Verificação UPAC':                          { valor: 'quadro_upac',                      notas: 'observacoes_upac' },
  'Verificação QGBT':                          { valor: 'qgbt_qe',                          notas: 'observacoes_qgbt_qe' },
  'Verificação UPS Geral':                     { valor: 'ups_geral',                        notas: 'observacoes_ups_geral' },
  'Verificação UPS Seg':                       { valor: 'ups_seguranca',                    notas: 'observacoes_ups_seguranca' },
  'Verificação Quadros Elétricos Normal':      { valor: 'quadros_eletricos_normais',        notas: 'observacoes_quadros_eletricos_normais' },
  'Verificação Quadros Elétricos Emergência/UPS': { valor: 'quadros_eletricos_emergencia_ups', notas: 'observacoes_quadros_eletricos_emergencia_ups' },
  'Verificação Quadro AVAC':                   { valor: 'quadro_avac',                      notas: 'observacoes_quadro_avac' },
  'Verificação Quadro frio':                   { valor: 'quadro_frio',                      notas: 'observacoes_quadro_frio' },
  'Verificação Mobilidade Elétrica':           { valor: 'quadro_mobilidade_eletrica',       notas: 'observacoes_quadro_mobilidade_eletrica' },
  'Verificação Botoneira Corte Geral':         { valor: 'botoneira_de_corte_geral',         notas: 'observacoes_botoneira_de_corte_geral' },
  'Verificação Iluminação Normal':             { valor: 'iluminacao_normal',                notas: 'observacoes_iluminacao_normal' },
  'Verificação Iluminação Emergência':         { valor: 'iluminacao_seguranca',             notas: 'observacoes_iluminacao_seguranca' },
  'Verificação Proteções Diferenciais':        { valor: 'protecoes_diferenciais',           notas: 'observacoes_protecoes_diferenciais' },
  'Verificação Tomadas':                       { valor: 'tomadas',                          notas: 'observacoes_tomadas' },
  'Verificação Caminhos Cabos':                { valor: 'caminho_de_cabos',                 notas: 'observacoes_caminho_de_cabos' },
  'Verificação Limpeza e Manutenção':          { valor: 'limpeza_e_manutencao',             notas: 'observacoes_limpeza_e_manutencao' },
  'Verificação Zona. Publico':                 { valor: 'zona_de_publico',                  notas: 'observacoes_zona_de_publico' },
}

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

    // Recolher todas as chaves necessárias (valores + notas)
    const todasChaves = new Set<string>()
    for (const m of Object.values(MAPA_VERIFICACOES)) {
      todasChaves.add(m.valor)
      if (m.notas) todasChaves.add(m.notas)
    }

    // Buscar respostas desta visita para todos os campos de verificação
    const { data: respostas } = await supabase
      .from('visita_respostas')
      .select('valor_opcoes, valor_texto, campos!inner(chave)')
      .eq('visita_id', visita_id)
      .in('campos.chave', [...todasChaves])

    // Construir mapa chave → valor
    const mapaRespostas: Record<string, string> = {}
    for (const r of respostas ?? []) {
      const chave = (r.campos as any)?.chave
      if (!chave) continue
      if (r.valor_opcoes !== null && r.valor_opcoes !== undefined) {
        const v = Array.isArray(r.valor_opcoes) ? r.valor_opcoes[0] : r.valor_opcoes
        if (v) mapaRespostas[chave] = v
      } else if (r.valor_texto) {
        mapaRespostas[chave] = r.valor_texto
      }
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
    const verificacoesPreenchidas = Object.values(MAPA_VERIFICACOES).filter(m => mapaRespostas[m.valor]).length
    log(`Verificações preenchidas: ${verificacoesPreenchidas} de ${Object.keys(MAPA_VERIFICACOES).length}`)

    const lo_id_padded = visita.lojas.nextbitt_lo_id.padEnd(20)
    const descricao = `${visita.templates?.nome ?? 'Inspeção'} — ${visita.lojas?.nome}`

    // 1. Procurar OT Preventiva (MP) da loja
    log(`A procurar OT Preventiva para loja ${lo_id_padded.trim()}...`)
    let woId: number | null = null
    let woWork: number = 1
    let woDescricao: string = ''
    try {
      const otRes = await fetch(
        `${BASE}/wo_workord?$filter=ty_id eq 'MP' and lo_id eq '${lo_id_padded}'&$select=wo_id,wo_work,lo_id,xx_sit,xx_descrip&$top=1`,
        { headers }
      )
      if (otRes.ok) {
        const otData = await otRes.json()
        const ot = otData.value?.[0]
        if (ot) {
          woId = ot.wo_id
          woWork = ot.wo_work ?? 1
          woDescricao = ot.xx_descrip ?? ''
          log(`OT encontrada: wo_id=${woId} wo_work=${woWork} | situação=${ot.xx_sit} | ${woDescricao.trim()}`)
        } else {
          log(`Aviso: nenhuma OT Preventiva encontrada para esta loja`)
        }
      } else {
        log(`Aviso: erro ao procurar OT (HTTP ${otRes.status})`)
      }
    } catch (e: any) {
      log(`Aviso: erro ao procurar OT: ${e?.message}`)
    }

    if (!woId) {
      return NextResponse.json({ erro: 'Não foi encontrada OT Preventiva (MP) para esta loja no Nextbitt.', logs }, { status: 404 })
    }

    // 2. Fechar a OT — chave composta (wo_id, wo_work) obrigatória em OData
    // xx_dscwork é campo obrigatório mesmo que não visível na UI
    const dataFecho = new Date(visita.data_visita + 'T12:00:00').toISOString()
    const patchPayload = { xx_sit: '14', wo_dateend: dataFecho, xx_descrip: woDescricao, xx_dscwork: woDescricao.trim() }
    log(`A fechar OT ${woId} — payload: ${JSON.stringify(patchPayload)}`)

    let patchRes: Response
    try {
      patchRes = await fetch(`${BASE}/wo_workord(wo_id=${woId},wo_work=${woWork})`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(patchPayload),
      })
    } catch (e: any) {
      return NextResponse.json({ erro: `Erro de rede ao fechar OT: ${e?.message}`, logs }, { status: 502 })
    }

    log(`Resposta fecho OT: HTTP ${patchRes.status}`)

    if (!patchRes.ok) {
      const msg = await extrairErroNextbitt(patchRes, 'Fecho da OT')
      log(`ERRO: ${msg}`)
      return NextResponse.json({ erro: msg, logs }, { status: 502 })
    }

    log(`OT ${woId} fechada com sucesso.`)

    // Verificar estado actual da OT
    try {
      const verificaRes = await fetch(
        `${BASE}/wo_workord(${woId})?$select=wo_id,xx_sit,wo_dateend,xx_descrip,lo_id`,
        { headers }
      )
      if (verificaRes.ok) {
        const ot = await verificaRes.json()
        log(`Verificação OT: wo_id=${ot.wo_id} | situação=${ot.xx_sit} | data fecho=${ot.wo_dateend ?? 'null'} | loja=${ot.lo_id?.trim()}`)
      } else {
        log(`Aviso: não foi possível verificar OT (HTTP ${verificaRes.status})`)
      }
    } catch (e: any) {
      log(`Aviso: erro na verificação: ${e?.message}`)
    }

    // 3. Preencher checklist (pm_jobchs) campo a campo
    if (verificacoesPreenchidas > 0) {
      log(`A preencher checklist Nextbitt (${verificacoesPreenchidas} campos)...`)

      // Buscar todos os itens do checklist desta OT
      let checklistItems: Array<{ xx_ident: number; pm_task: string }> = []
      try {
        const chkRes = await fetch(
          `${BASE}/pm_jobchs?$filter=wo_id eq ${woId}&$select=xx_ident,pm_task`,
          { headers }
        )
        if (chkRes.ok) {
          const chkData = await chkRes.json()
          checklistItems = chkData.value ?? []
          log(`Checklist obtido: ${checklistItems.length} itens`)
        } else {
          log(`Aviso: não foi possível obter checklist (HTTP ${chkRes.status})`)
        }
      } catch (e: any) {
        log(`Aviso: erro ao obter checklist: ${e?.message}`)
      }

      // Para cada pm_task, verificar se temos resposta e fazer PATCH
      let preenchidos = 0
      let erros = 0
      const dataRealizacao = new Date(visita.data_visita + 'T12:00:00').toISOString()

      for (const [pmTask, mapa] of Object.entries(MAPA_VERIFICACOES)) {
        const valor = mapaRespostas[mapa.valor]
        if (!valor) continue

        const item = checklistItems.find(i => i.pm_task === pmTask)
        if (!item) {
          log(`Aviso: pm_task "${pmTask}" não encontrado no checklist da OT`)
          continue
        }

        // Nextbitt aceita "OK", "NOK", "Sem Aplicacao" (sem acento)
        const valorNextbitt = valor === 'Sem Aplicação' ? 'Sem Aplicacao' : valor
        const notas = mapa.notas ? mapaRespostas[mapa.notas] : undefined

        const patchBody: Record<string, any> = {
          pm_state_name: valorNextbitt,
          xx_dt_rec: dataRealizacao,
        }
        if (notas) patchBody.pm_obs = notas.slice(0, 400)

        try {
          const r = await fetch(`${BASE}/pm_jobchs(${item.xx_ident})`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(patchBody),
          })
          if (r.ok) {
            log(`✓ ${pmTask} → ${valorNextbitt}${notas ? ' (com notas)' : ''}`)
            preenchidos++
          } else {
            const msg = await extrairErroNextbitt(r, pmTask)
            log(`✗ ${pmTask}: ${msg}`)
            erros++
          }
        } catch (e: any) {
          log(`✗ ${pmTask}: erro de rede — ${e?.message}`)
          erros++
        }
      }

      log(`Checklist concluído: ${preenchidos} preenchidos, ${erros} erros.`)
    } else {
      log(`Nenhuma verificação preenchida — checklist não actualizado.`)
    }

    // 4. Anexar PDF assinado à OT
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
              us_prof: String(woId),
              xx_type: 'wo_workord',
              us_shtname: `relatorio_${visita_id.slice(0, 20)}.pdf`,
              xx_desc: `PDF Relatório — ${descricao.slice(0, 80)}`,
              co_id: 'RELVISIT',
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
    }

    // 5. Guardar wo_id no Supabase
    await supabase.from('visitas').update({
      nextbitt_id: String(woId),
      nextbitt_exportado_em: new Date().toISOString(),
    }).eq('id', visita_id)
    log('Visita actualizada no Supabase com nextbitt_id (wo_id).')

    return NextResponse.json({ ok: true, nextbitt_id: woId, aviso: avisoUpload || undefined, logs })
  } catch (err: any) {
    console.error('[Nextbitt] Erro inesperado:', err?.message)
    return NextResponse.json({ erro: err.message ?? 'Erro desconhecido.' }, { status: 500 })
  }
}
