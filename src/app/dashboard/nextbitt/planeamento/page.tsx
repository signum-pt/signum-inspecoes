'use client'

import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, CheckCircle, Clock, AlertCircle, XCircle, ChevronUp, ChevronDown } from 'lucide-react'
import Link from 'next/link'

const SITUACAO_COR: Record<string, string> = {
  '14': 'bg-green-100 text-green-700',
  '13': 'bg-blue-100 text-blue-700',
  '12': 'bg-yellow-100 text-yellow-700',
  '05': 'bg-red-100 text-red-700',
}

const SITUACAO_ICONE: Record<string, any> = {
  '14': CheckCircle,
  '13': Clock,
  '05': XCircle,
}

function BadgeSituacao({ codigo, label }: { codigo: string; label: string }) {
  const cor = SITUACAO_COR[codigo] ?? 'bg-gray-100 text-gray-600'
  const Icon = SITUACAO_ICONE[codigo] ?? AlertCircle
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cor}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

export default function PlaneamentoPage() {
  const [ots, setOts] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [totalLojas, setTotalLojas] = useState(0)

  const [filtroAno, setFiltroAno] = useState(String(new Date().getFullYear()))
  const [filtroSemestre, setFiltroSemestre] = useState('')
  const [filtroSituacao, setFiltroSituacao] = useState('')
  const [ordenacao, setOrdenacao] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'data_planeada', dir: 'asc' })

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const res = await fetch('/api/nextbitt/planeamento')
      const data = await res.json()
      if (!res.ok) { setErro(data.erro ?? 'Erro desconhecido'); return }
      setOts(data.ots ?? [])
      setTotalLojas(data.total_lojas ?? 0)
    } catch {
      setErro('Erro de rede')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const anos = useMemo(() => [...new Set(ots.map(o => o.ano).filter(Boolean))].sort().reverse(), [ots])

  const otsFiltradas = useMemo(() => {
    let r = ots
    if (filtroAno) r = r.filter(o => o.ano === filtroAno)
    if (filtroSemestre) r = r.filter(o => String(o.semestre) === filtroSemestre)
    if (filtroSituacao) r = r.filter(o => o.situacao_codigo === filtroSituacao)
    return [...r].sort((a, b) => {
      const va = a[ordenacao.col] ?? ''
      const vb = b[ordenacao.col] ?? ''
      return ordenacao.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
  }, [ots, filtroAno, filtroSemestre, filtroSituacao, ordenacao])

  function toggleOrdenacao(col: string) {
    setOrdenacao(o => o.col === col ? { col, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' })
  }

  function ThSort({ col, label }: { col: string; label: string }) {
    const ativo = ordenacao.col === col
    return (
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
        onClick={() => toggleOrdenacao(col)}>
        <span className="flex items-center gap-1">
          {label}
          {ativo ? (ordenacao.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronUp className="w-3 h-3 opacity-20" />}
        </span>
      </th>
    )
  }

  // Resumo por situação
  const resumo = useMemo(() => {
    const r: Record<string, number> = {}
    for (const o of otsFiltradas) {
      r[o.situacao_codigo] = (r[o.situacao_codigo] ?? 0) + 1
    }
    return r
  }, [otsFiltradas])

  const fechadas = resumo['14'] ?? 0
  const porFechar = otsFiltradas.length - fechadas

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planeamento Nextbitt</h1>
          <p className="text-gray-500 text-sm mt-1">
            OTs de Manutenção Preventiva para as {totalLojas} lojas com código Nextbitt
          </p>
        </div>
        <button onClick={carregar} disabled={carregando}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={filtroAno} onChange={e => setFiltroAno(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D41317]">
          <option value="">Todos os anos</option>
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filtroSemestre} onChange={e => setFiltroSemestre(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D41317]">
          <option value="">Ambos os semestres</option>
          <option value="1">1º Semestre</option>
          <option value="2">2º Semestre</option>
        </select>
        <select value={filtroSituacao} onChange={e => setFiltroSituacao(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D41317]">
          <option value="">Todas as situações</option>
          <option value="14">Fechado</option>
          <option value="13">Em curso</option>
          <option value="12">Programado</option>
          <option value="07">Por executar</option>
          <option value="05">Anulado</option>
        </select>
      </div>

      {/* Resumo */}
      {!carregando && !erro && otsFiltradas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{otsFiltradas.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total OTs</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-green-600">{fechadas}</p>
            <p className="text-xs text-gray-500 mt-0.5">Fechadas</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{porFechar}</p>
            <p className="text-xs text-gray-500 mt-0.5">Por fechar</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {otsFiltradas.length > 0 ? Math.round((fechadas / otsFiltradas.length) * 100) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Concluídas</p>
          </div>
        </div>
      )}

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">{erro}</div>
      )}

      {carregando ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          A consultar Nextbitt...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <ThSort col="loja_nome" label="Loja" />
                <ThSort col="wo_id" label="OT" />
                <ThSort col="semestre" label="Sem." />
                <ThSort col="data_planeada" label="Data planeada" />
                <ThSort col="data_fecho" label="Data fecho" />
                <ThSort col="situacao" label="Situação" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {otsFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">Nenhuma OT encontrada</td>
                </tr>
              ) : otsFiltradas.map(o => (
                <tr key={`${o.wo_id}-${o.wo_work}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{o.loja_nome}</div>
                    {o.loja_codigo && <div className="text-xs text-gray-400">{o.loja_codigo}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600">{o.wo_id}/{o.wo_work}</td>
                  <td className="px-4 py-3 text-gray-600">{o.semestre ? `${o.semestre}º ${o.ano}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {o.data_planeada ? new Date(o.data_planeada + 'T12:00:00').toLocaleDateString('pt-PT') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {o.data_fecho ? new Date(o.data_fecho + 'T12:00:00').toLocaleDateString('pt-PT') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <BadgeSituacao codigo={o.situacao_codigo} label={o.situacao} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {otsFiltradas.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
              {otsFiltradas.length} OT{otsFiltradas.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
