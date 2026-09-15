'use client'

import { useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { criarNegocio } from './actions'
import { useRouter } from 'next/navigation'

export default function NovoNegocioButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await criarNegocio(new FormData(e.currentTarget))
    setLoading(false)
    if (!res.ok) {
      setError(res.error ?? 'Erro ao criar')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ backgroundColor: '#D41317' }}
      >
        <Plus className="w-4 h-4" />
        Novo negócio
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Novo negócio</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Designação <span className="text-red-500">*</span>
                </label>
                <input
                  name="designacao"
                  required
                  placeholder="Ex: KFC Fafe — Elétrico"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Concelho</label>
                <input
                  name="concelho"
                  placeholder="Ex: Fafe"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Valor proposta (€)</label>
                <input
                  name="valor_proposta"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  name="observacoes"
                  rows={3}
                  placeholder="Notas sobre esta proposta…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
                />
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60"
                  style={{ backgroundColor: '#D41317' }}
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Criar negócio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
