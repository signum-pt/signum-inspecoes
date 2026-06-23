'use client'

import { useState, useEffect } from 'react'
import { X, Search, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Campo, TipoCampo } from '@/lib/types'

const tipoLabel: Record<TipoCampo, string> = {
  texto: 'Texto', numero: 'Número', sim_nao: 'Sim/Não',
  escolha_multipla: 'Múltipla', data: 'Data', foto: 'Foto', observacao: 'Observação',
  separador: 'Separador',
}
const tipoCor: Record<TipoCampo, string> = {
  texto: 'bg-blue-50 text-blue-700', numero: 'bg-purple-50 text-purple-700',
  sim_nao: 'bg-green-50 text-green-700', escolha_multipla: 'bg-orange-50 text-orange-700',
  data: 'bg-pink-50 text-pink-700', foto: 'bg-yellow-50 text-yellow-700',
  observacao: 'bg-gray-100 text-gray-600', separador: 'bg-gray-800 text-white',
}

interface Props {
  camposGlobais: Campo[]
  camposJaAdicionados: string[]
  onAdicionar: (campo: Campo) => void
  onFechar: () => void
}

export default function ModalAdicionarCampo({ camposGlobais, camposJaAdicionados, onAdicionar, onFechar }: Props) {
  const [tab, setTab] = useState<'biblioteca' | 'instalacao'>('biblioteca')
  const [pesquisa, setPesquisa] = useState('')
  const [camposSistema, setCamposSistema] = useState<Campo[]>([])

  useEffect(() => {
    if (tab === 'instalacao' && camposSistema.length === 0) {
      createClient()
        .from('campos')
        .select('*')
        .eq('sistema', true)
        .eq('ativo', true)
        .order('nome')
        .then(({ data }) => { if (data) setCamposSistema(data) })
    }
  }, [tab])

  const camposFiltrados = camposGlobais.filter(c =>
    !c.sistema &&
    (c.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
      c.chave.toLowerCase().includes(pesquisa.toLowerCase()))
  )

  const tabs = [
    { id: 'biblioteca' as const, label: 'Biblioteca' },
    { id: 'instalacao' as const, label: 'Instalação' },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Adicionar campo</h3>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === t.id ? 'border-b-2 text-[#D41317]' : 'text-gray-500 hover:text-gray-700'}`}
              style={tab === t.id ? { borderBottomColor: '#D41317' } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Biblioteca */}
        {tab === 'biblioteca' && (
          <>
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input autoFocus value={pesquisa} onChange={e => setPesquisa(e.target.value)}
                  placeholder="Pesquisar campos globais..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317]" />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {camposFiltrados.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Nenhum campo encontrado.</p>
              ) : camposFiltrados.map(c => {
                const jaAdicionado = camposJaAdicionados.includes(c.id)
                return (
                  <button key={c.id} type="button" disabled={jaAdicionado}
                    onClick={() => onAdicionar(c)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${jaAdicionado ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{c.nome}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.chave}{c.unidade ? ` · ${c.unidade}` : ''}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${tipoCor[c.tipo] ?? 'bg-gray-100'}`}>
                      {tipoLabel[c.tipo]}
                    </span>
                    {jaAdicionado && <span className="text-xs text-gray-400">✓</span>}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Tab: Instalação */}
        {tab === 'instalacao' && (
          <div className="overflow-y-auto flex-1">
            <div className="px-4 py-3 border-b border-gray-100 bg-amber-50">
              <p className="text-xs text-amber-700 flex items-start gap-1.5">
                <Building2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                Estes campos são pré-preenchidos automaticamente com os dados da loja ao criar uma visita.
              </p>
            </div>
            <div className="p-2">
              {camposSistema.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">A carregar...</p>
              )}
              {camposSistema.map(c => {
                const jaAdicionado = camposJaAdicionados.includes(c.id)
                return (
                  <button key={c.id} type="button" onClick={() => onAdicionar(c)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{c.nome}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.chave}{c.unidade ? ` · ${c.unidade}` : ''}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${tipoCor[c.tipo]}`}>
                      {tipoLabel[c.tipo]}
                    </span>
                    {jaAdicionado && <span className="text-xs text-gray-400">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
