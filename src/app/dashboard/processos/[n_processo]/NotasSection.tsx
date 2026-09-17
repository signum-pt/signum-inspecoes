'use client'

import { useState } from 'react'
import { Send, Trash2, Loader2 } from 'lucide-react'
import { adicionarNota, eliminarNota } from './actions'

type Nota = { id: string; nota: string; criado_em: string; autor_id: string; profiles: { nome: string } | null }

export default function NotasSection({
  nProcesso, notas: inicial, userId, isAdmin,
}: {
  nProcesso: number
  notas: Nota[]
  userId: string
  isAdmin: boolean
}) {
  const [notas, setNotas] = useState(inicial)
  const [texto, setTexto] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function submit() {
    if (!texto.trim()) return
    setSaving(true)
    const res = await adicionarNota(nProcesso, texto)
    setSaving(false)
    if (res.ok) setTexto('')
  }

  async function apagar(notaId: string) {
    setDeletingId(notaId)
    await eliminarNota(notaId, nProcesso)
    setNotas(prev => prev.filter(n => n.id !== notaId))
    setDeletingId(null)
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Notas</h2>

      {notas.length > 0 ? (
        <div className="space-y-2 mb-3">
          {notas.map((nota) => {
            const minha = nota.autor_id === userId
            const podeApagar = isAdmin || minha
            return (
              <div key={nota.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{nota.profiles?.nome}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(nota.criado_em).toLocaleDateString('pt-PT', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                    {podeApagar && (
                      <button onClick={() => apagar(nota.id)} disabled={deletingId === nota.id}
                        className="text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40">
                        {deletingId === nota.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{nota.nota}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400 bg-white rounded-xl border border-dashed border-gray-200 py-6 text-center mb-3">
          Sem notas.
        </p>
      )}

      {/* Adicionar nota */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit() }}
          rows={2}
          placeholder="Adicionar nota… (Ctrl+Enter para guardar)"
          className="w-full text-sm resize-none focus:outline-none text-gray-800 placeholder-gray-300"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={submit}
            disabled={saving || !texto.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: '#D41317' }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
