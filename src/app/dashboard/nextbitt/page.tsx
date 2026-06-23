'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2, ChevronDown, ChevronRight } from 'lucide-react'

interface ResultadoEndpoint {
  ok: boolean
  desc: string
  status?: number
  data?: any[]
  erro?: string
}

interface Resultados {
  [key: string]: ResultadoEndpoint
}

function SecaoResultado({ chave, resultado }: { chave: string; resultado: ResultadoEndpoint }) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {resultado.ok
            ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          }
          <span className="text-sm font-medium text-gray-900">{resultado.desc}</span>
          {resultado.ok && resultado.data && (
            <span className="text-xs text-gray-400">{resultado.data.length} resultado(s)</span>
          )}
          {!resultado.ok && (
            <span className="text-xs text-red-500">{resultado.erro}</span>
          )}
        </div>
        {resultado.ok && resultado.data && resultado.data.length > 0 && (
          aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {aberto && resultado.data && resultado.data.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(resultado.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function NextbittDiagnosticoPage() {
  const [modo, setModo] = useState<'token' | 'credenciais'>('token')
  const [token, setToken] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [a_testar, setATestar] = useState(false)
  const [erro, setErro] = useState('')
  const [resultados, setResultados] = useState<Resultados | null>(null)
  const [modoUsado, setModoUsado] = useState('')

  async function testar() {
    setATestar(true)
    setErro('')
    setResultados(null)

    const body = modo === 'token'
      ? { token }
      : { username, password }

    const res = await fetch('/api/nextbitt/diagnostico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const json = await res.json()
    setATestar(false)

    if (!res.ok || json.erro) {
      setErro(json.erro ?? 'Erro desconhecido.')
      return
    }

    setResultados(json.resultados)
    setModoUsado(json.modo)
  }

  const totalOk = resultados ? Object.values(resultados).filter(r => r.ok).length : 0
  const total = resultados ? Object.keys(resultados).length : 0

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Diagnóstico Nextbitt</h1>
        <p className="text-gray-500 text-sm mt-1">
          Testa a ligação à API Nextbitt e consulta os códigos disponíveis no sistema da Sonae.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-5">
        {/* Modo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Método de autenticação</label>
          <div className="flex gap-3">
            <button
              onClick={() => setModo('token')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                modo === 'token'
                  ? 'text-white border-transparent'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={modo === 'token' ? { backgroundColor: '#D41317' } : {}}
            >
              Bearer Token
            </button>
            <button
              onClick={() => setModo('credenciais')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                modo === 'credenciais'
                  ? 'text-white border-transparent'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={modo === 'credenciais' ? { backgroundColor: '#D41317' } : {}}
            >
              Username / Password
            </button>
          </div>
        </div>

        {/* Campos */}
        {modo === 'token' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
            <input
              type="text"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Cole aqui o token Bearer..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D41317]"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="username.sonae"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317]"
              />
            </div>
          </div>
        )}

        <div className="pt-1">
          <button
            onClick={testar}
            disabled={a_testar || (modo === 'token' ? !token : !username || !password)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#D41317' }}
          >
            {a_testar && <Loader2 className="w-4 h-4 animate-spin" />}
            {a_testar ? 'A testar ligação...' : 'Testar ligação'}
          </button>
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Falha na ligação</p>
              <p className="text-sm text-red-600 mt-1 whitespace-pre-wrap">{erro}</p>
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {resultados && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Resultados</h2>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              totalOk === total
                ? 'bg-green-100 text-green-700'
                : totalOk === 0
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {totalOk}/{total} endpoints OK
            </span>
          </div>

          <div className="space-y-2">
            {Object.entries(resultados).map(([chave, resultado]) => (
              <SecaoResultado key={chave} chave={chave} resultado={resultado} />
            ))}
          </div>

          {totalOk > 0 && (
            <p className="text-xs text-gray-400 pt-2">
              Clica em cada linha para ver os dados devolvidos pela API — esses são os códigos a usar na integração.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
