'use client'

import { useState } from 'react'
import { Check, X, Edit2, Loader2, AlertCircle, Clock, Ban, CheckCircle2 } from 'lucide-react'
import { atualizarTrabalho } from './actions'

const ESTADOS = ['a fazer', 'urgente', 'em curso', 'pendente', 'concluído', 'cancelado']

const estadoCor: Record<string, string> = {
  'a fazer':   'bg-gray-100 text-gray-600',
  'urgente':   'bg-red-100 text-red-700',
  'em curso':  'bg-blue-100 text-blue-700',
  'pendente':  'bg-amber-100 text-amber-700',
  'concluído': 'bg-green-100 text-green-700',
  'cancelado': 'bg-gray-100 text-gray-400',
}

const estadoIcon: Record<string, any> = {
  'a fazer':   Clock,
  'urgente':   AlertCircle,
  'em curso':  Loader2,
  'pendente':  Loader2,
  'concluído': CheckCircle2,
  'cancelado': Ban,
}

type Trabalho = {
  id: string
  estado: string
  especialidade: string | null
  prazo: string | null
  profiles: { nome: string } | null
}

export default function TrabalhoRow({
  trabalho, nProcesso, canEdit,
}: {
  trabalho: Trabalho
  nProcesso: number
  canEdit: boolean
}) {
  const [estado, setEstado] = useState(trabalho.estado)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingEstado, setPendingEstado] = useState(trabalho.estado)

  async function guardar() {
    setSaving(true)
    const res = await atualizarTrabalho(trabalho.id, nProcesso, { estado: pendingEstado })
    setSaving(false)
    if (res.ok) { setEstado(pendingEstado); setEditing(false) }
  }

  const Icon = estadoIcon[estado] ?? Clock
  const cor = estadoCor[estado] ?? 'bg-gray-100 text-gray-500'

  return (
    <div className="flex items-center gap-3 px-4 py-3 group">
      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          <select
            value={pendingEstado}
            onChange={e => setPendingEstado(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-200"
          >
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <button onClick={guardar} disabled={saving}
            className="text-green-600 hover:text-green-700 disabled:opacity-40">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => { setPendingEstado(estado); setEditing(false) }}
            className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 min-w-0 ml-1">
            <p className="text-sm text-gray-800 truncate">{trabalho.especialidade || '—'}</p>
            {trabalho.profiles?.nome && <p className="text-xs text-gray-400">{trabalho.profiles.nome}</p>}
          </div>
        </div>
      ) : (
        <>
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${cor}`}>
            <Icon className="w-3 h-3" /> {estado}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 truncate">{trabalho.especialidade || '—'}</p>
            {trabalho.profiles?.nome && <p className="text-xs text-gray-400">{trabalho.profiles.nome}</p>}
          </div>
          {trabalho.prazo && (
            <p className="text-xs text-gray-400 flex-shrink-0">
              {new Date(trabalho.prazo).toLocaleDateString('pt-PT')}
            </p>
          )}
          {canEdit && (
            <button onClick={() => setEditing(true)}
              className="text-gray-200 hover:text-gray-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  )
}
