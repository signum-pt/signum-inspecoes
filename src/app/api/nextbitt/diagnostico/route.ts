import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const NEXTBITT_BASE = 'https://sonaemc.nextbitt.net'
const OAM_HOST = 'https://autaprov.sonaecenter.pt'
const ODATA = `${NEXTBITT_BASE}/odata`

// Cache partilhado com o route de exportar
let sessionCookie: string | null = null
let sessionExpiry: number = 0

async function obterCookieSessao(username: string, password: string): Promise<string> {
  if (sessionCookie && Date.now() < sessionExpiry) return sessionCookie

  const samlInit = await fetch(`${NEXTBITT_BASE}/api0/Account/Saml?ReturnUrl=%2fodata%2fwo_request`, {
    redirect: 'manual',
  })
  const samlRedirect = samlInit.headers.get('location')
  if (!samlRedirect) throw new Error('Resposta inesperada no início do fluxo SAML.')

  const idpRes = await fetch(samlRedirect.startsWith('http') ? samlRedirect : OAM_HOST + samlRedirect, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  const idpHtml = await idpRes.text()
  const idpCookies = idpRes.headers.getSetCookie?.() ?? []

  const requestIdMatch = idpHtml.match(/name="request_id"\s+value="([^"]+)"/)
  const requestId = requestIdMatch?.[1] ?? ''

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

  const samlResponseHtml = await loginRes.text()
  const samlResponseMatch = samlResponseHtml.match(/name="SAMLResponse"\s+value="([^"]+)"/)
  const relayStateMatch = samlResponseHtml.match(/name="RelayState"\s+value="([^"]+)"/)
  const acsActionMatch = samlResponseHtml.match(/action="([^"]+)"/)

  if (!samlResponseMatch) throw new Error('Credenciais inválidas ou fluxo SAML alterado.')

  const samlResponse = samlResponseMatch[1]
  const relayState = relayStateMatch?.[1] ?? ''
  const acsAction = acsActionMatch?.[1] ?? `${NEXTBITT_BASE}/api0/Account/Saml`

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
  if (!cookie) throw new Error('Sessão não criada após autenticação SAML.')

  sessionCookie = cookie.split(';')[0]
  sessionExpiry = Date.now() + 8 * 60 * 60 * 1000
  return sessionCookie
}

async function fetchNextbitt(cookie: string, path: string): Promise<{ ok: boolean; status: number; data?: any; erro?: string }> {
  try {
    const res = await fetch(`${ODATA}/${path}?$top=5&$format=json`, {
      headers: {
        'Cookie': cookie,
        'Accept': 'application/json',
      },
      redirect: 'manual',
    })

    if (res.status === 302 || res.status === 301) {
      return { ok: false, status: res.status, erro: 'Sessão expirada — redireccionado para login.' }
    }

    if (!res.ok) {
      return { ok: false, status: res.status, erro: `HTTP ${res.status}` }
    }

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

  const { username, password, token } = await req.json()

  const resultados: Record<string, any> = {}

  // Modo Bearer token (quando Sonae fornecer token direto)
  if (token) {
    const endpoints = [
      { key: 'situacoes', path: 'wo_wostatus', desc: 'Situações (dy_id_stat)' },
      { key: 'equipas', path: 'wo_trade', desc: 'Equipas (tr_id)' },
      { key: 'sectores', path: 'as_sector', desc: 'Sectores (se_id)' },
      { key: 'localizacoes', path: 'as_locat', desc: 'Localizações (lo_id)' },
    ]

    for (const ep of endpoints) {
      try {
        const res = await fetch(`${ODATA}/${ep.path}?$top=10&$format=json`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          redirect: 'manual',
        })
        if (res.ok) {
          const data = await res.json()
          resultados[ep.key] = { ok: true, desc: ep.desc, data: data.value ?? data }
        } else {
          resultados[ep.key] = { ok: false, desc: ep.desc, erro: `HTTP ${res.status}` }
        }
      } catch (e: any) {
        resultados[ep.key] = { ok: false, desc: ep.desc, erro: e.message }
      }
    }

    return NextResponse.json({ modo: 'bearer', resultados })
  }

  // Modo SAML com username/password
  if (!username || !password) {
    return NextResponse.json({ erro: 'Forneça username/password ou token.' }, { status: 400 })
  }

  let cookie: string
  try {
    cookie = await obterCookieSessao(username, password)
  } catch (e: any) {
    return NextResponse.json({ erro: `Falha no login: ${e.message}` }, { status: 401 })
  }

  const endpoints = [
    { key: 'situacoes', path: 'wo_wostatus', desc: 'Situações (dy_id_stat)' },
    { key: 'equipas', path: 'wo_trade', desc: 'Equipas (tr_id)' },
    { key: 'sectores', path: 'as_sector', desc: 'Sectores (se_id)' },
    { key: 'tiposServico', path: 'wo_wotype', desc: 'Tipos de serviço (xx_var)' },
    { key: 'problemas', path: 'wo_flaw', desc: 'Problemas (fl_id)' },
    { key: 'localizacoes', path: 'as_locat', desc: 'Localizações das lojas (lo_id)' },
  ]

  for (const ep of endpoints) {
    resultados[ep.key] = await fetchNextbitt(cookie, ep.path)
    resultados[ep.key].desc = ep.desc
  }

  return NextResponse.json({ modo: 'saml', resultados })
}
