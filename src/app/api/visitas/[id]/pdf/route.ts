import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import RelatorioPDF from '@/lib/pdf/RelatorioPDF'
import path from 'path'
import fs from 'fs'

async function logoParaBase64(origem: string, fallbackFicheiro?: string): Promise<string> {
  try {
    if (origem.startsWith('http')) {
      const res = await fetch(origem)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const ab = await res.arrayBuffer()
      const buf = Buffer.from(ab)
      const mime = res.headers.get('content-type') ?? 'image/png'
      return `data:${mime};base64,${buf.toString('base64')}`
    } else if (fallbackFicheiro) {
      try {
        const caminho = path.join(process.cwd(), 'public', 'logos', fallbackFicheiro)
        const buf = fs.readFileSync(caminho)
        const ext = fallbackFicheiro.split('.').pop()?.toLowerCase() ?? 'png'
        const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
        return `data:${mime};base64,${buf.toString('base64')}`
      } catch {
        // ficheiro não encontrado no filesystem — tentar via HTTP público
        try {
          const host = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://signum-inspecoes.vercel.app'
          const res = await fetch(`${host}/logos/${fallbackFicheiro}`)
          if (!res.ok) return ''
          const buf = Buffer.from(await res.arrayBuffer())
          const ext = fallbackFicheiro.split('.').pop()?.toLowerCase() ?? 'png'
          const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
          return `data:${mime};base64,${buf.toString('base64')}`
        } catch { return '' }
      }
    }
    return ''
  } catch (e) {
    console.warn(`Erro ao processar logo:`, e)
    if (origem.startsWith('http') && fallbackFicheiro) {
      return logoParaBase64('', fallbackFicheiro)
    }
    return ''
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: visita } = await supabase
    .from('visitas')
    .select('*, lojas(*, entidades(*)), profiles(nome), templates(nome, referencia)')
    .eq('id', id)
    .single()

  if (!visita) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  let secoes = visita.template_snapshot ?? null
  if (!secoes) {
    const { data } = await supabase
      .from('template_secoes')
      .select(`*, template_campos(*, campos(*))`)
      .eq('template_id', visita.template_id)
      .order('ordem')
    secoes = data ?? []
  }

  const { data: respostas } = await supabase
    .from('visita_respostas').select('*').eq('visita_id', id)

  const { data: fotos } = await supabase
    .from('visita_fotos').select('*').eq('visita_id', id).order('ordem')

  // Configurações da empresa
  const { data: configRows } = await supabase
    .from('configuracoes').select('chave, valor')

  const configMap: Record<string, string> = {}
  configRows?.forEach((r: any) => { configMap[r.chave] = r.valor })

  const config = {
    empresa_nome:     configMap['empresa_nome']     ?? 'Signum',
    empresa_morada:   configMap['empresa_morada']   ?? '',
    empresa_telefone: configMap['empresa_telefone'] ?? '',
    empresa_email:    configMap['empresa_email']    ?? '',
    empresa_website:  configMap['empresa_website']  ?? '',
  }

  // Logos — usa URL do Storage se disponível, senão fallback local
  const [signum, iso14001, iso9001, pmeExcelencia, pmeLider] = await Promise.all([
    logoParaBase64(configMap['logo_signum'] || '', 'signum.png'),
    logoParaBase64(configMap['logo_iso14001'] || '', 'iso14001.png'),
    logoParaBase64(configMap['logo_iso9001'] || '', 'iso9001.png'),
    logoParaBase64(configMap['logo_pme_excelencia'] || '', 'pme-excelencia.png'),
    logoParaBase64(configMap['logo_pme_lider'] || '', 'pme-lider.png'),
  ])
  const logos = { signum, iso14001, iso9001, pmeExcelencia, pmeLider }

  console.log('Logos carregados:', {
    signum:        logos.signum.length > 0 ? 'OK' : 'FALHOU',
    iso14001:      logos.iso14001.length > 0 ? 'OK' : 'FALHOU',
    iso9001:       logos.iso9001.length > 0 ? 'OK' : 'FALHOU',
    pmeExcelencia: logos.pmeExcelencia.length > 0 ? 'OK' : 'FALHOU',
    pmeLider:      logos.pmeLider.length > 0 ? 'OK' : 'FALHOU',
  })

  const visitaDados = {
    loja: {
      nome:        visita.lojas?.nome ?? '',
      cpe:         visita.lojas?.cpe ?? '',
      alimentacao: visita.lojas?.alimentacao ?? '',
    },
    entidade:            { nome: visita.lojas?.entidades?.nome ?? '' },
    tecnico:             { nome: visita.profiles?.nome ?? '' },
    data_visita:         visita.data_visita,
    nome_cliente:        visita.nome_cliente,
    observacoes_gerais:  visita.observacoes_gerais,
    assinatura_cliente:  visita.assinatura_cliente,
    numero_processo:     visita.id.slice(0, 8).toUpperCase(),
    template_referencia: visita.templates?.referencia ?? '',
  }

  try {
    // Converter fotos para base64 via sharp
    const fotosComBase64 = await Promise.all(
      (fotos ?? []).map(async (f: any) => {
        try {
          const b64 = await logoParaBase64(f.url)
          return { url: f.url, base64: b64, legenda: f.legenda }
        } catch {
          return { url: f.url, legenda: f.legenda }
        }
      })
    )

    const elemento = createElement(RelatorioPDF, {
      visita: visitaDados,
      secoes: secoes ?? [],
      respostas: respostas ?? [],
      fotos: fotosComBase64,
      logos,
      config,
    }) as any

    const buffer = await renderToBuffer(elemento as any)
    const nomeLoja = visita.lojas?.nome?.replace(/\s+/g, '-').toLowerCase() ?? 'relatorio'
    const nomeArquivo = `relatorio-${nomeLoja}-${visita.data_visita}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
      },
    })
  } catch (err) {
    console.error('Erro ao gerar PDF:', err)
    return NextResponse.json({ error: 'Erro ao gerar PDF', detalhe: String(err) }, { status: 500 })
  }
}
