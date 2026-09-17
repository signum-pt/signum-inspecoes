'use client'

import { useState } from 'react'
import { X, Loader2, CheckCircle2, FolderOpen, Plus } from 'lucide-react'
import { aprovarNegocio } from './actions'

type Processo = { n_processo: number; designacao: string; concelho: string | null }
type Negocio = { id: string; designacao: string; concelho: string | null; negocio_servicos: { count: number }[] }

const INPUT = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400'

export default function AprovarNegocioModal({
  negocio,
  processos,
  onClose,
  onSuccess,
}: {
  negocio: Negocio
  processos: Processo[]
  onClose: () => void
  onSuccess: (nProcesso: number) => void
}) {
  const [modo, setModo] = useState<'novo' | 'existente'>('novo')
  const [designacao, setDesignacao] = useState(negocio.designacao)
  const [concelho, setConcelho] = useState(negocio.concelho ?? '')
  const [ano, setAno] = useState(new Date().getFullYear())
  const [nProcessoSel, setNProcessoSel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nServicos = negocio.negocio_servicos?.[0]?.count ?? 0

  async function confirmar() {
    setSaving(true)
    setError(null)
    const res = await aprovarNegocio(negocio.id, {
      criarProcesso: modo === 'novo',
      nProcessoExistente: modo === 'existente' ? Number(nProcessoSel) : undefined,
      designacao,
      concelho: concelho || undefined,
      primeiro_ano: ano,
    })
    setSaving(false)
    if (!res.ok) { setError(res.error ?? 'Erro'); return }
    onSuccess(res.nProcesso!)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Aprovar negócio</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{negocio.designacao}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info serviços */}
        {nServicos > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-4 text-xs text-blue-700">
            {nServicos} trabalho{nServicos !== 1 ? 's' : ''} da proposta serão criados no processo
          </div>
        )}

        {/* Toggle modo */}
        <div className="flex gap-2 mb-4">
          {(['novo', 'existente'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                modo === m ? 'text-white border-transparent' : 'text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              style={modo === m ? { backgroundColor: '#D41317' } : {}}
            >
              {m === 'novo' ? <><Plus className="w-3 h-3" /> Criar processo</> : <><FolderOpen className="w-3 h-3" /> Processo existente</>}
            </button>
          ))}
        </div>

        {modo === 'novo' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Designação do processo <span className="text-red-500">*</span></label>
              <input value={designacao} onChange={e => setDesignacao(e.target.value)} className={INPUT} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Concelho</label>
                <input value={concelho} onChange={e => setConcelho(e.target.value)} placeholder="—" className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ano</label>
                <input type="number" value={ano} onChange={e => setAno(Number(e.target.value))} className={INPUT} />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Selecionar processo</label>
            <select value={nProcessoSel} onChange={e => setNProcessoSel(e.target.value)} className={INPUT} required>
              <option value="">Selecionar…</option>
              {processos.map(p => (
                <option key={p.n_processo} value={p.n_processo}>
                  #{p.n_processo} — {p.designacao}{p.concelho ? ` · ${p.concelho}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={saving || (modo === 'existente' && !nProcessoSel) || !designacao.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
            style={{ backgroundColor: '#D41317' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Aprovar
          </button>
        </div>
      </div>
    </div>
  )
}
