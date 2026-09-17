'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MapPin, User, FolderOpen, Euro,
  CheckCircle2, Clock, AlertTriangle, Ban, Loader2,
} from 'lucide-react'
import { atualizarStatusNegocio } from './actions'

type Status = 'pendente' | 'em_execucao' | 'concluido' | 'faturar' | 'faturado' | 'cancelado'

type Negocio = {
  id: string
  designacao: string
  status: Status
  concelho: string | null
  valor_proposta: number | null
  n_processo: number | null
  criado_em: string
  requerentes: { nome: string } | null
  lojas: { nome: string; entidades: { nome: string }[] | null } | null
  negocio_servicos: { count: number }[]
}

const COLUNAS: { key: Status; label: string; cor: string; corFundo: string }[] = [
  { key: 'pendente',    label: 'Pendente',     cor: 'text-amber-700',  corFundo: 'bg-amber-50 border-amber-200' },
  { key: 'em_execucao', label: 'Em Execução',  cor: 'text-blue-700',   corFundo: 'bg-blue-50 border-blue-200' },
  { key: 'concluido',  label: 'Concluído',     cor: 'text-green-700',  corFundo: 'bg-green-50 border-green-200' },
  { key: 'faturar',    label: 'Faturar',       cor: 'text-orange-700', corFundo: 'bg-orange-50 border-orange-200' },
  { key: 'faturado',   label: 'Faturado',      cor: 'text-gray-600',   corFundo: 'bg-gray-50 border-gray-200' },
]

const HEADER_COR: Record<Status, string> = {
  pendente:    'bg-amber-400',
  em_execucao: 'bg-blue-500',
  concluido:   'bg-green-500',
  faturar:     'bg-orange-500',
  faturado:    'bg-gray-400',
  cancelado:   'bg-gray-300',
}

// Transições permitidas por drag
const TRANSICOES_PERMITIDAS: Record<Status, Status[]> = {
  pendente:    ['em_execucao', 'cancelado'],
  em_execucao: ['concluido'],
  concluido:   ['faturar', 'em_execucao'],
  faturar:     ['faturado', 'concluido'],
  faturado:    [],
  cancelado:   [],
}

// Transições que precisam confirmação
const CONFIRMAR: Partial<Record<string, string>> = {
  'pendente→em_execucao': 'Aprovar e passar a Em Execução? Será associado a um processo.',
  'faturar→faturado':     'Confirmar que a faturação ao cliente foi emitida?',
  'concluido→em_execucao': 'Reabrir este negócio e passar de volta a Em Execução?',
}

export default function KanbanBoard({ negocios: initial, canEdit }: { negocios: Negocio[]; canEdit: boolean }) {
  const router = useRouter()
  const [negocios, setNegocios] = useState<Negocio[]>(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ id: string; novoStatus: Status; msg: string } | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const dragId = useRef<string | null>(null)
  const dragStatus = useRef<Status | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function moverNegocio(id: string, novoStatus: Status) {
    const chave = `${dragStatus.current}→${novoStatus}`
    if (CONFIRMAR[chave]) {
      setConfirm({ id, novoStatus, msg: CONFIRMAR[chave]! })
      return
    }
    await executarMover(id, novoStatus)
  }

  async function executarMover(id: string, novoStatus: Status) {
    setLoading(id)
    setConfirm(null)
    const anterior = negocios.find(n => n.id === id)?.status ?? null
    setNegocios(prev => prev.map(n => n.id === id ? { ...n, status: novoStatus } : n))
    const res = await atualizarStatusNegocio(id, novoStatus)
    setLoading(null)
    if (!res.ok) {
      setNegocios(prev => prev.map(n => n.id === id ? { ...n, status: anterior as Status } : n))
      showToast(res.error ?? 'Erro ao atualizar', false)
    } else {
      showToast('Estado atualizado')
      router.refresh()
    }
  }

  const grupos: Record<Status, Negocio[]> = {
    pendente: [], em_execucao: [], concluido: [], faturar: [], faturado: [], cancelado: [],
  }
  for (const n of negocios) {
    if (n.status in grupos) grupos[n.status].push(n)
  }

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg transition-all ${
          toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Modal confirmação */}
      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Confirmar ação</h3>
            <p className="text-sm text-gray-600 mb-5">{confirm.msg}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => executarMover(confirm.id, confirm.novoStatus)}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#D41317' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
        {COLUNAS.map(col => {
          const cards = grupos[col.key]
          return (
            <div key={col.key} className="flex-shrink-0 w-64">
              {/* Header coluna */}
              <div className={`rounded-t-xl px-3 py-2.5 flex items-center justify-between ${HEADER_COR[col.key]}`}>
                <span className="text-xs font-bold text-white uppercase tracking-wide">{col.label}</span>
                <span className="text-xs font-bold text-white/80 bg-white/20 rounded-full px-2 py-0.5">
                  {cards.length}
                </span>
              </div>

              {/* Drop zone */}
              <div
                className={`rounded-b-xl border-2 border-t-0 min-h-48 p-2 space-y-2 transition-colors ${col.corFundo}`}
                onDragOver={e => {
                  if (!canEdit) return
                  const from = dragStatus.current
                  if (from && TRANSICOES_PERMITIDAS[from]?.includes(col.key)) {
                    e.preventDefault()
                    e.currentTarget.classList.add('ring-2', 'ring-offset-1', 'ring-blue-400')
                  }
                }}
                onDragLeave={e => e.currentTarget.classList.remove('ring-2', 'ring-offset-1', 'ring-blue-400')}
                onDrop={async e => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('ring-2', 'ring-offset-1', 'ring-blue-400')
                  const id = dragId.current
                  const from = dragStatus.current
                  if (!id || !from) return
                  if (!TRANSICOES_PERMITIDAS[from]?.includes(col.key)) return
                  dragId.current = null
                  dragStatus.current = null
                  await moverNegocio(id, col.key)
                }}
              >
                {cards.map(n => (
                  <NegocioCard
                    key={n.id}
                    negocio={n}
                    canEdit={canEdit}
                    isLoading={loading === n.id}
                    onDragStart={() => {
                      dragId.current = n.id
                      dragStatus.current = n.status
                    }}
                  />
                ))}
                {cards.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-xs text-gray-300 select-none">
                    Sem negócios
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NegocioCard({
  negocio: n,
  canEdit,
  isLoading,
  onDragStart,
}: {
  negocio: Negocio
  canEdit: boolean
  isLoading: boolean
  onDragStart: () => void
}) {
  const servicos = n.negocio_servicos?.[0]?.count ?? 0

  return (
    <div
      draggable={canEdit && !isLoading}
      onDragStart={onDragStart}
      className={`bg-white rounded-xl border border-gray-200 p-3 shadow-sm transition-all select-none ${
        canEdit ? 'cursor-grab active:cursor-grabbing hover:shadow-md hover:border-gray-300' : ''
      } ${isLoading ? 'opacity-50' : ''}`}
    >
      {isLoading && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          A atualizar…
        </div>
      )}

      <Link
        href={`/dashboard/negocios/${n.id}`}
        onClick={e => e.stopPropagation()}
        className="block text-sm font-semibold text-gray-900 leading-snug mb-1.5 hover:text-red-600 transition-colors"
      >
        {n.designacao}
      </Link>

      {n.requerentes?.nome && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <User className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{n.requerentes.nome}</span>
        </div>
      )}

      {n.lojas && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{n.lojas.nome}</span>
        </div>
      )}

      {n.n_processo && (
        <Link
          href={`/dashboard/processos/${n.n_processo}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 mb-1"
        >
          <FolderOpen className="w-3 h-3 flex-shrink-0" />
          Proc. #{n.n_processo}
        </Link>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {servicos > 0 ? `${servicos} serviço${servicos !== 1 ? 's' : ''}` : 'Sem serviços'}
        </span>
        {n.valor_proposta != null && (
          <div className="flex items-center gap-0.5 text-xs font-semibold text-gray-700">
            <Euro className="w-3 h-3" />
            {n.valor_proposta.toLocaleString('pt-PT', { minimumFractionDigits: 0 })}
          </div>
        )}
      </div>
    </div>
  )
}
