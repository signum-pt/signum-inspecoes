'use client'

import { useState } from 'react'
import { Plus, X, Loader2, Check } from 'lucide-react'
import { adicionarTrabalho } from './actions'

const ESTADOS = ['a fazer', 'urgente', 'em curso', 'pendente', 'concluído', 'cancelado']
const INPUT = 'w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400'

type Tecnico = { id: string; nome: string }

export default function AdicionarTrabalhoForm({
  nProcesso, tecnicos,
}: {
  nProcesso: number
  tecnicos: Tecnico[]
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [campos, setCampos] = useState({
    especialidade: '',
    descricao: '',
    estado: 'a fazer',
    ano: new Date().getFullYear(),
    prazo: '',
    tecnico_id: '',
  })

  async function submit() {
    if (!campos.especialidade.trim()) { setError('Especialidade obrigatória'); return }
    setSaving(true)
    setError(null)
    const res = await adicionarTrabalho(nProcesso, {
      especialidade: campos.especialidade.trim(),
      descricao: campos.descricao || undefined,
      estado: campos.estado,
      ano: campos.ano,
      prazo: campos.prazo || null,
      tecnico_id: campos.tecnico_id || null,
    })
    setSaving(false)
    if (!res.ok) { setError(res.error ?? 'Erro'); return }
    setCampos({ especialidade: '', descricao: '', estado: 'a fazer', ano: new Date().getFullYear(), prazo: '', tecnico_id: '' })
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors mt-2 px-1"
      >
        <Plus className="w-3.5 h-3.5" />
        Adicionar trabalho
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-700">Novo trabalho</p>
        <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-gray-500">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Especialidade <span className="text-red-500">*</span></label>
          <input
            value={campos.especialidade}
            onChange={e => setCampos(p => ({ ...p, especialidade: e.target.value }))}
            placeholder="Ex: Elétrico, AVAC, Gás…"
            className={INPUT}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Descrição</label>
          <input
            value={campos.descricao}
            onChange={e => setCampos(p => ({ ...p, descricao: e.target.value }))}
            placeholder="Descrição do trabalho…"
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Estado</label>
          <select value={campos.estado} onChange={e => setCampos(p => ({ ...p, estado: e.target.value }))} className={INPUT}>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ano</label>
          <input
            type="number"
            value={campos.ano}
            onChange={e => setCampos(p => ({ ...p, ano: Number(e.target.value) }))}
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Prazo</label>
          <input
            type="date"
            value={campos.prazo}
            onChange={e => setCampos(p => ({ ...p, prazo: e.target.value }))}
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Técnico</label>
          <select value={campos.tecnico_id} onChange={e => setCampos(p => ({ ...p, tecnico_id: e.target.value }))} className={INPUT}>
            <option value="">Sem técnico</option>
            {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      <div className="flex justify-end gap-2 mt-3">
        <button onClick={() => setOpen(false)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5">
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-40"
          style={{ backgroundColor: '#D41317' }}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Guardar
        </button>
      </div>
    </div>
  )
}
