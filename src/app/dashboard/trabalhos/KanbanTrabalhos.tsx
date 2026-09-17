'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { AlertCircle, Clock, Loader2, CheckCircle2, Ban, FolderOpen, User, CalendarDays } from 'lucide-react'
import { moverTrabalho } from './actions'

type Trabalho = {
  id: string
  estado: string
  especialidade: string | null
  descricao: string | null
  prazo: string | null
  n_processo: number
  processos: { designacao: string; lojas: { nome: string }[] | null } | null
  profiles: { nome: string } | null
}

const COLUNAS = [
  { key: 'a fazer',   label: 'A fazer',    cor: 'text-gray-600',   fundo: 'bg-gray-50 border-gray-200' },
  { key: 'urgente',   label: 'Urgente',    cor: 'text-red-700',    fundo: 'bg-red-50 border-red-200' },
  { key: 'em curso',  label: 'Em curso',   cor: 'text-blue-700',   fundo: 'bg-blue-50 border-blue-200' },
  { key: 'pendente',  label: 'Pendente',   cor: 'text-amber-700',  fundo: 'bg-amber-50 border-amber-200' },
  { key: 'concluído', label: 'Concluído',  cor: 'text-green-700',  fundo: 'bg-green-50 border-green-200' },
]

const estadoIcon: Record<string, any> = {
  'a fazer':   Clock,
  'urgente':   AlertCircle,
  'em curso':  Loader2,
  'pendente':  Clock,
  'concluído': CheckCircle2,
  'cancelado': Ban,
}

const TRANSICOES: Record<string, string[]> = {
  'a fazer':   ['urgente', 'em curso', 'pendente', 'concluído', 'cancelado'],
  'urgente':   ['a fazer', 'em curso', 'pendente', 'concluído', 'cancelado'],
  'em curso':  ['a fazer', 'urgente', 'pendente', 'concluído', 'cancelado'],
  'pendente':  ['a fazer', 'urgente', 'em curso', 'concluído', 'cancelado'],
  'concluído': ['a fazer', 'em curso', 'cancelado'],
  'cancelado': ['a fazer'],
}

function TrabalhoCard({ t, onDragStart }: { t: Trabalho; onDragStart: (id: string, estado: string) => void }) {
  const prazoDate = t.prazo ? new Date(t.prazo) : null
  const hoje = new Date()
  const atrasado = prazoDate && prazoDate < hoje && t.estado !== 'concluído' && t.estado !== 'cancelado'
  const loja = t.processos?.lojas?.[0]?.nome

  return (
    <div
      draggable
      onDragStart={() => onDragStart(t.id, t.estado)}
      className="bg-white rounded-xl border border-gray-200 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow select-none"
    >
      {t.especialidade && (
        <p className="text-xs font-semibold text-gray-800 mb-1">{t.especialidade}</p>
      )}
      {t.descricao && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{t.descricao}</p>
      )}
      <Link
        href={`/dashboard/processos/${t.n_processo}`}
        onClick={e => e.stopPropagation()}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 transition-colors mb-1"
      >
        <FolderOpen className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">#{t.n_processo} {t.processos?.designacao ?? ''}</span>
      </Link>
      {loja && (
        <p className="text-xs text-gray-400 truncate mb-1">{loja}</p>
      )}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
        {t.profiles?.nome ? (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <User className="w-3 h-3" /> {t.profiles.nome}
          </span>
        ) : <span />}
        {prazoDate && (
          <span className={`flex items-center gap-1 text-xs ${atrasado ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
            <CalendarDays className="w-3 h-3" />
            {prazoDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  )
}

export default function KanbanTrabalhos({ trabalhos: inicial }: { trabalhos: Trabalho[] }) {
  const [trabalhos, setTrabalhos] = useState(inicial)
  const [over, setOver] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)
  const dragEstado = useRef<string | null>(null)

  function onDragStart(id: string, estado: string) {
    dragId.current = id
    dragEstado.current = estado
  }

  async function onDrop(novoEstado: string) {
    const id = dragId.current
    const estadoAtual = dragEstado.current
    if (!id || !estadoAtual || estadoAtual === novoEstado) { setOver(null); return }
    if (!TRANSICOES[estadoAtual]?.includes(novoEstado)) { setOver(null); return }

    // Optimistic
    setTrabalhos(prev => prev.map(t => t.id === id ? { ...t, estado: novoEstado } : t))
    setOver(null)
    const res = await moverTrabalho(id, novoEstado)
    if (!res.ok) setTrabalhos(inicial) // rollback
  }

  const porEstado = (estado: string) => trabalhos.filter(t => t.estado === estado)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUNAS.map(col => {
        const cards = porEstado(col.key)
        const isOver = over === col.key
        return (
          <div
            key={col.key}
            className={`flex-shrink-0 w-64 rounded-xl border p-3 transition-colors ${col.fundo} ${isOver ? 'ring-2 ring-offset-1 ring-gray-300' : ''}`}
            onDragOver={e => { e.preventDefault(); setOver(col.key) }}
            onDragLeave={() => setOver(null)}
            onDrop={() => onDrop(col.key)}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold ${col.cor}`}>{col.label}</span>
              <span className="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5 border border-gray-100">
                {cards.length}
              </span>
            </div>
            <div className="space-y-2">
              {cards.map(t => (
                <TrabalhoCard key={t.id} t={t} onDragStart={onDragStart} />
              ))}
              {cards.length === 0 && (
                <div className="h-16 rounded-lg border border-dashed border-gray-200 bg-white/50" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
