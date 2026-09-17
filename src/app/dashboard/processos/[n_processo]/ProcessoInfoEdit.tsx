'use client'

import { useState } from 'react'
import { Edit2, Check, X } from 'lucide-react'
import { atualizarProcesso } from './actions'

type Campo = {
  designacao: string
  concelho: string
  aberto: boolean
  notas: string
}

const INPUT = 'w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400'

export default function ProcessoInfoEdit({
  nProcesso, initial, canEdit,
}: {
  nProcesso: number
  initial: Campo
  canEdit: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [campos, setCampos] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    const res = await atualizarProcesso(nProcesso, {
      designacao: campos.designacao.trim() || undefined,
      concelho: campos.concelho || null as any,
      aberto: campos.aberto,
      notas: campos.notas || null as any,
    })
    setSaving(false)
    if (!res.ok) { setError(res.error ?? 'Erro'); return }
    setEditing(false)
  }

  function cancel() {
    setCampos(initial)
    setEditing(false)
    setError(null)
  }

  if (!canEdit) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Editar processo</h3>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-gray-600 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button onClick={save} disabled={saving}
              className="text-green-600 hover:text-green-700 disabled:opacity-40">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={cancel} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Designação</label>
            <input value={campos.designacao} onChange={e => setCampos(p => ({ ...p, designacao: e.target.value }))}
              className={INPUT} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Concelho</label>
            <input value={campos.concelho} onChange={e => setCampos(p => ({ ...p, concelho: e.target.value }))}
              placeholder="—" className={INPUT} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="aberto" checked={campos.aberto}
              onChange={e => setCampos(p => ({ ...p, aberto: e.target.checked }))}
              className="rounded" />
            <label htmlFor="aberto" className="text-sm text-gray-700">Processo aberto</label>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nota interna</label>
            <textarea value={campos.notas} onChange={e => setCampos(p => ({ ...p, notas: e.target.value }))}
              rows={3} placeholder="Observações internas…" className={INPUT + ' resize-none'} />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">Clique no lápis para editar os dados do processo.</p>
      )}
    </div>
  )
}
