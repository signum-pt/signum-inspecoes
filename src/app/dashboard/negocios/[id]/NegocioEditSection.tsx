'use client'

import { useState } from 'react'
import { Edit2, Check, X } from 'lucide-react'
import { editarNegocio } from './actions'

const INPUT = 'w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400'

type Props = {
  negocioId: string
  initial: { designacao: string; concelho: string; observacoes: string; valor_proposta: string | number; requerente_id: string; loja_id: string }
  requerentes: { id: string; nome: string }[]
  lojas: { id: string; nome: string; entidades: { nome: string }[] | null }[]
}

export default function NegocioEditSection({ negocioId, initial, requerentes, lojas }: Props) {
  const [editing, setEditing] = useState(false)
  const [campos, setCampos] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    const res = await editarNegocio(negocioId, {
      designacao: campos.designacao.trim() || undefined,
      concelho: campos.concelho || null,
      observacoes: campos.observacoes || null,
      valor_proposta: campos.valor_proposta !== '' ? Number(campos.valor_proposta) : null,
      requerente_id: campos.requerente_id || null,
      loja_id: campos.loja_id || null,
    })
    setSaving(false)
    if (!res.ok) { setError(res.error ?? 'Erro'); return }
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Editar negócio</h3>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-gray-600 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button onClick={save} disabled={saving} className="text-green-600 hover:text-green-700 disabled:opacity-40">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setCampos(initial); setEditing(false); setError(null) }}
              className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Designação</label>
            <input value={campos.designacao}
              onChange={e => setCampos(p => ({ ...p, designacao: e.target.value }))}
              className={INPUT} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Concelho</label>
            <input value={campos.concelho}
              onChange={e => setCampos(p => ({ ...p, concelho: e.target.value }))}
              placeholder="—" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Valor proposta (€)</label>
            <input type="number" min="0" step="0.01"
              value={campos.valor_proposta}
              onChange={e => setCampos(p => ({ ...p, valor_proposta: e.target.value }))}
              placeholder="0.00" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Requerente</label>
            <select value={campos.requerente_id}
              onChange={e => setCampos(p => ({ ...p, requerente_id: e.target.value }))}
              className={INPUT}>
              <option value="">Nenhum</option>
              {requerentes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Loja</label>
            <select value={campos.loja_id}
              onChange={e => setCampos(p => ({ ...p, loja_id: e.target.value }))}
              className={INPUT}>
              <option value="">Nenhuma</option>
              {lojas.map(l => (
                <option key={l.id} value={l.id}>
                  {l.nome}{l.entidades?.[0] ? ` — ${l.entidades[0].nome}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Observações</label>
            <textarea value={campos.observacoes}
              onChange={e => setCampos(p => ({ ...p, observacoes: e.target.value }))}
              rows={3} placeholder="—" className={INPUT + ' resize-none'} />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">Clique no lápis para editar.</p>
      )}
    </div>
  )
}
