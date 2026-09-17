'use client'

import { useState } from 'react'
import { Plus, Trash2, Loader2, Euro } from 'lucide-react'
import { eliminarServico, adicionarServico } from './actions'

type Servico = { id: string; descricao: string | null; quantidade: number; valor_unit: number | null; servicos: { nome: string }[] | null }
type ServicoDisp = { id: string; nome: string }

const INPUT = 'px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400'

export default function ServicosSection({ negocioId, servicos: inicial, servicosDisponiveis, totalProposta, canEdit }: {
  negocioId: string
  servicos: Servico[]
  servicosDisponiveis: ServicoDisp[]
  totalProposta: number
  canEdit: boolean
}) {
  const [servicos, setServicos] = useState(inicial)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nova, setNova] = useState({ servico_id: '', descricao: '', quantidade: '1', valor_unit: '' })

  async function apagar(id: string) {
    setDeletingId(id)
    await eliminarServico(id, negocioId)
    setServicos(prev => prev.filter(s => s.id !== id))
    setDeletingId(null)
  }

  async function adicionar() {
    if (!nova.servico_id) return
    setSaving(true)
    const res = await adicionarServico(negocioId, {
      servico_id: nova.servico_id,
      descricao: nova.descricao || undefined,
      quantidade: Number(nova.quantidade) || 1,
      valor_unit: nova.valor_unit ? Number(nova.valor_unit) : null,
    })
    setSaving(false)
    if (res.ok) { setNova({ servico_id: '', descricao: '', quantidade: '1', valor_unit: '' }); setAddOpen(false) }
  }

  const total = servicos.reduce((s, l) => s + (l.valor_unit ?? 0) * (l.quantidade ?? 1), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Trabalhos da proposta ({servicos.length})
        </h2>
        {total > 0 && (
          <span className="flex items-center gap-0.5 text-sm font-semibold text-gray-700">
            <Euro className="w-3.5 h-3.5" />
            {total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>

      {servicos.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50 mb-2">
          {servicos.map(s => {
            const nome = s.servicos?.[0]?.nome ?? '—'
            const subtotal = (s.valor_unit ?? 0) * (s.quantidade ?? 1)
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{nome}</p>
                  {s.descricao && <p className="text-xs text-gray-500 truncate">{s.descricao}</p>}
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0 text-right">
                  <p>Qtd: {s.quantidade}</p>
                  {s.valor_unit != null && (
                    <p className="font-medium text-gray-700">
                      {subtotal.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €
                    </p>
                  )}
                </div>
                {canEdit && (
                  <button onClick={() => apagar(s.id)} disabled={deletingId === s.id}
                    className="text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40 flex-shrink-0">
                    {deletingId === s.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 text-center py-8 text-gray-400 mb-2">
          <p className="text-sm">Sem trabalhos na proposta.</p>
        </div>
      )}

      {canEdit && (
        addOpen ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Especialidade</label>
                <select value={nova.servico_id}
                  onChange={e => setNova(p => ({ ...p, servico_id: e.target.value }))}
                  className={INPUT + ' w-full'}>
                  <option value="">Selecionar…</option>
                  {servicosDisponiveis.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Descrição</label>
                <input value={nova.descricao}
                  onChange={e => setNova(p => ({ ...p, descricao: e.target.value }))}
                  placeholder="—" className={INPUT + ' w-full'} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantidade</label>
                <input type="number" min="1" value={nova.quantidade}
                  onChange={e => setNova(p => ({ ...p, quantidade: e.target.value }))}
                  className={INPUT + ' w-full text-center'} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Preço unit. (€)</label>
                <input type="number" min="0" step="0.01" value={nova.valor_unit}
                  onChange={e => setNova(p => ({ ...p, valor_unit: e.target.value }))}
                  placeholder="0.00" className={INPUT + ' w-full text-right'} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAddOpen(false)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5">
                Cancelar
              </button>
              <button onClick={adicionar} disabled={saving || !nova.servico_id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-40"
                style={{ backgroundColor: '#D41317' }}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Adicionar
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors px-1">
            <Plus className="w-3.5 h-3.5" /> Adicionar linha
          </button>
        )
      )}
    </div>
  )
}
