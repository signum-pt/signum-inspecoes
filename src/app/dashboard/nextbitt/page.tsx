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

function SecaoResultado({ resultado }: { resultado: ResultadoEndpoint }) {
  const [aberto, setAberto] = useState(false)
  const temDados = resultado.ok && resultado.data && resultado.data.length > 0

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => temDados && setAberto(!aberto)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-white transition-colors ${temDados ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-center gap-3">
          {resultado.ok
            ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          }
          <span className="text-sm font-medium text-gray-900">{resultado.desc}</span>
          {resultado.ok && resultado.data && (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{resultado.data.length} registos</span>
          )}
          {!resultado.ok && (
            <span className="text-xs text-red-500">{resultado.erro}</span>
          )}
        </div>
        {temDados && (
          aberto
            ? <ChevronDown className="w-4 h-4 text-gray-400" />
            : <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {aberto && resultado.data && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 max-h-80 overflow-y-auto">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
            {JSON.stringify(resultado.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function NextbittDiagnosticoPage() {
  const [ambiente, setAmbiente] = useState<'qa' | 'prod'>('qa')
  const [token, setToken] = useState('')
  const [a_testar, setATestar] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState<{ base: string; resultados: Record<string, ResultadoEndpoint> } | null>(null)

  async function testar() {
    setATestar(true)
    setErro('')
    setResultado(null)

    const res = await fetch('/api/nextbitt/diagnostico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token || undefined, ambiente }),
    })

    const json = await res.json()
    setATestar(false)

    if (!res.ok || json.erro) {
      setErro(json.erro ?? 'Erro desconhecido.')
      return
    }

    setResultado(json)
  }

  const totalOk = resultado ? Object.values(resultado.resultados).filter(r => r.ok).length : 0
  const total = resultado ? Object.keys(resultado.resultados).length : 0

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Diagnóstico Nextbitt</h1>
        <p className="text-gray-500 text-sm mt-1">
          Testa a ligação à API e consulta os códigos configurados no sistema da Sonae.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-5">
        {/* Ambiente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ambiente</label>
          <div className="flex gap-3">
            {(['qa', 'prod'] as const).map(a => (
              <button key={a} onClick={() => setAmbiente(a)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  ambiente === a ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                style={ambiente === a ? { backgroundColor: '#D41317' } : {}}>
                {a === 'qa' ? 'QA (testes)' : 'Produção'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {ambiente === 'qa' ? 'sonaemcapitest.nextbitt.net' : 'sonaemcapi.nextbitt.net'}
          </p>
        </div>

        {/* Token */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token <span className="text-gray-400 font-normal">(deixar vazio para usar o configurado no servidor)</span>
          </label>
          <input
            type="text"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Bearer token..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D41317]"
          />
        </div>

        <button
          onClick={testar}
          disabled={a_testar}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
          style={{ backgroundColor: '#D41317' }}
        >
          {a_testar && <Loader2 className="w-4 h-4 animate-spin" />}
          {a_testar ? 'A testar...' : 'Testar ligação'}
        </button>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Falha na ligação</p>
            <p className="text-sm text-red-600 mt-1">{erro}</p>
          </div>
        </div>
      )}

      {resultado && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Resultados</h2>
              <p className="text-xs text-gray-400 mt-0.5">{resultado.base}</p>
            </div>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              totalOk === total ? 'bg-green-100 text-green-700'
              : totalOk === 0 ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
            }`}>
              {totalOk}/{total} OK
            </span>
          </div>

          <div className="space-y-2">
            {Object.entries(resultado.resultados).map(([chave, r]) => (
              <SecaoResultado key={chave} resultado={r} />
            ))}
          </div>

          {totalOk > 0 && (
            <p className="text-xs text-gray-400 pt-1">
              Clica em cada linha para ver os dados — esses são os códigos a usar na integração.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
