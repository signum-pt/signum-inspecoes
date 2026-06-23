import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const NEXTBITT_BASE = 'https://sonaemc.nextbitt.net'
const OAM_HOST = 'https://autaprov.sonaecenter.pt'
const ODATA = `${NEXTBITT_BASE}/odata`

// Cache do cookie de sessão em memória (persiste durante o processo Node)
let sessionCookie: string | null = null
let sessionExpiry: number = 0

async function obterCookieSessao(): Promise<string> {
  if (sessionCookie && Date.now() < sessionExpiry) return sessionCookie

  const username = process.env.NEXTBITT_USERNAME
  const password = process.env.NEXTBITT_PASSWORD
  if (!username || !password) throw new Error('Credenciais Nextbitt não configuradas (NEXTBITT_USERNAME / NEXTBITT_PASSWORD).')

  // Passo 1: pedir página de login para obter o SAMLRequest e cookies OAM
  const samlInit = await fetch(`${NEXTBITT_BASE}/api0/Account/Saml?ReturnUrl=%2fodata%2fwo_request`, {
    redirect: 'manual',
  })
  const samlRedirect = samlInit.headers.get('location')
  if (!samlRedirect) throw new Error('Login Nextbitt: resposta inesperada no início do fluxo SAML.')

  // Passo 2: seguir para o IdP da Sonae para obter o formulário de login
  const idpRes = await fetch(samlRedirect.startsWith('http') ? samlRedirect : OAM_HOST + samlRedirect, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  const idpHtml = await idpRes.text()
  const idpCookies = idpRes.headers.getSetCookie?.() ?? []

  // Extrair o request_id hidden do formulário
  const requestIdMatch = idpHtml.match(/name="request_id"\s+value="([^"]+)"/)
  const requestId = requestIdMatch?.[1] ?? ''

  // Passo 3: submeter credenciais ao OAM
  const loginBody = new URLSearchParams({ username, password, request_id: requestId })
  const loginRes = await fetch(`${OAM_HOST}/oam/server/auth_cred_submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      'Cookie': idpCookies.join('; '),
    },
    body: loginBody.toString(),
    redirect: 'manual',
  })

  // O OAM responde com um form HTML que contém um SAMLResponse para POST de volta ao Nextbitt
  const samlResponseHtml = await loginRes.text()
  const samlResponseMatch = samlResponseHtml.match(/name="SAMLResponse"\s+value="([^"]+)"/)
  const relayStateMatch = samlResponseHtml.match(/name="RelayState"\s+value="([^"]+)"/)
  const acsActionMatch = samlResponseHtml.match(/action="([^"]+)"/)

  if (!samlResponseMatch) throw new Error('Login Nextbitt: credenciais inválidas ou fluxo SAML alterado.')

  const samlResponse = samlResponseMatch[1]
  const relayState = relayStateMatch?.[1] ?? ''
  const acsAction = acsActionMatch?.[1] ?? `${NEXTBITT_BASE}/api0/Account/Saml`

  // Passo 4: POST do SAMLResponse de volta ao Nextbitt (Assertion Consumer Service)
  const acsBody = new URLSearchParams({ SAMLResponse: samlResponse, RelayState: relayState })
  const acsRes = await fetch(acsAction.startsWith('http') ? acsAction : NEXTBITT_BASE + acsAction, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
    },
    body: acsBody.toString(),
    redirect: 'manual',
  })

  const setCookies = acsRes.headers.getSetCookie?.() ?? []
  const cookie = setCookies.find(c => c.includes('.AspNet.') || c.includes('ASP.NET') || c.toLowerCase().includes('auth') || c.toLowerCase().includes('session'))
  if (!cookie) throw new Error('Login Nextbitt: sessão não foi criada após autenticação SAML.')

  // Guardar apenas o nome=valor do cookie (sem atributos como Path, HttpOnly, etc.)
  sessionCookie = cookie.split(';')[0]
  sessionExpiry = Date.now() + 8 * 60 * 60 * 1000 // cache 8 horas
  return sessionCookie
}

async function fetchNextbitt(url: string, options: RequestInit = {}, tentativa = 1): Promise<Response> {
  const cookie = await obterCookieSessao()
  const res = await fetch(url, {
    ...options,
    headers: {
      'Cookie': cookie,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    redirect: 'manual',
  })

  // Se redireciona para login, a sessão expirou — limpar e tentar de novo (1x)
  if ((res.status === 302 || res.status === 301) && tentativa === 1) {
    sessionCookie = null
    sessionExpiry = 0
    return fetchNextbitt(url, options, 2)
  }

  return res
}

async function extrairErroNextbitt(res: Response, contexto: string): Promise<string> {
  const statusMensagem: Record<number, string> = {
    400: 'Pedido inválido — verifique os dados enviados.',
    401: 'Sessão expirada ou inválida.',
    404: 'Recurso não encontrado no Nextbitt.',
    406: 'Pedido não aceite — algum parâmetro não é esperado pelo Nextbitt.',
    409: 'Conflito — já existe um registo em conflito com este pedido.',
  }
  let detalhe = ''
  try {
    const body = await res.json()
    detalhe = body?.['odata.error']?.message?.value ?? ''
  } catch { /* body não é JSON */ }
  const descricaoHttp = statusMensagem[res.status]
    ?? (res.status >= 500 ? `Erro interno do servidor Nextbitt (${res.status}).` : `Erro ${res.status}.`)
  return detalhe ? `${contexto}: ${descricaoHttp}\nDetalhe: ${detalhe}` : `${contexto}: ${descricaoHttp}`
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

    const dataVisita = new Date(visita.data_visita + 'T12:00:00').toISOString()
    const descricao = `${visita.templates?.nome ?? 'Inspeção'} — ${visita.lojas?.nome}`
    const observacoes = [
      visita.observacoes_gerais ? `Obs: ${visita.observacoes_gerais}` : null,
      visita.nome_cliente ? `Cliente: ${visita.nome_cliente}` : null,
      `Técnico: ${visita.profiles?.nome ?? ''}`,
    ].filter(Boolean).join('\n')

    // Criar Pedido de Intervenção
    let pedidoRes: Response
    try {
      pedidoRes = await fetchNextbitt(`${ODATA}/wo_request`, {
        method: 'POST',
        body: JSON.stringify({
          xx_datep: dataVisita,
          lo_id: visita.lojas.nextbitt_lo_id,
          xx_descrip: descricao.slice(0, 100),
          dy_id_stat: '01',
          re_requestedby: visita.profiles?.nome ?? '',
          xx_obs: observacoes,
          re_extref: visita_id,
        }),
      })
    } catch (e: any) {
      console.error('[Nextbitt] Erro de rede:', e?.message)
      return NextResponse.json({ erro: `Não foi possível contactar o Nextbitt: ${e?.message ?? 'erro desconhecido'}` }, { status: 502 })
    }

    if (!pedidoRes.ok) {
      const msg = await extrairErroNextbitt(pedidoRes, 'Criação do pedido')
      console.error('[Nextbitt]', msg)
      return NextResponse.json({ erro: msg }, { status: 502 })
    }

    let pedido: any
    try { pedido = await pedidoRes.json() } catch {
      return NextResponse.json({ erro: 'Pedido criado no Nextbitt mas a resposta não pôde ser lida.' }, { status: 502 })
    }
    const nextbittId = pedido.re_id ?? pedido.value ?? String(Date.now())

    // Upload do PDF assinado (se existir)
    let avisoUpload = ''
    if (visita.pdf_assinado_url) {
      try {
        const pdfRes = await fetch(visita.pdf_assinado_url)
        if (pdfRes.ok) {
          const pdfBase64 = Buffer.from(await pdfRes.arrayBuffer()).toString('base64')
          const uploadRes = await fetchNextbitt(`${ODATA}/cf_imalink`, {
            method: 'POST',
            body: JSON.stringify({
              us_prof: String(nextbittId),
              xx_type: 'wo_request',
              us_shtname: `relatorio_${visita_id}.pdf`,
              xx_desc: `PDF Relatório — ${descricao}`,
              co_id: 'PDF',
              cf_actiontype: '0',
              cf_base64: pdfBase64,
              us_private: false,
            }),
          })
          if (!uploadRes.ok) {
            avisoUpload = await extrairErroNextbitt(uploadRes, 'Upload do PDF')
          }
        }
      } catch (e: any) {
        avisoUpload = `Pedido criado com sucesso, mas o PDF não pôde ser anexado: ${e?.message ?? 'erro de rede'}`
      }
    }

    await supabase.from('visitas').update({
      nextbitt_id: String(nextbittId),
      nextbitt_exportado_em: new Date().toISOString(),
    }).eq('id', visita_id)

    return NextResponse.json({ ok: true, nextbitt_id: nextbittId, aviso: avisoUpload || undefined })
  } catch (err: any) {
    console.error('[Nextbitt] Erro inesperado:', err?.message)
    return NextResponse.json({ erro: err.message ?? 'Erro desconhecido.' }, { status: 500 })
  }
}
