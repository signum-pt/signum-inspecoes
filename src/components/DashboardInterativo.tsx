'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, ClipboardList, ChevronRight } from 'lucide-react'
import MapaPortugal, { type DistritoContagem } from './MapaPortugal'

export interface LojaInfo {
  id: string
  nome: string
  cidade: string
  entidade_nome: string
  ultimo_estado: string | null
  ultima_visita_data: string | null
}

export interface VisitaRecente {
  id: string
  data_visita: string
  estado: string
  loja_nome: string
  tecnico_nome: string
}

interface Props {
  dadosMapa: DistritoContagem[]
  lojasPorDistrito: Record<string, LojaInfo[]>
  visitasRecentes: VisitaRecente[]
}

const estadoLabel: Record<string, string> = {
  rascunho: 'Rascunho',
  em_curso: 'Em curso',
  concluida: 'Concluída',
  assinada: 'Assinada',
}

const estadoCor: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-600',
  em_curso: 'bg-orange-100 text-orange-700',
  concluida: 'bg-green-100 text-green-700',
  assinada: 'bg-indigo-100 text-indigo-700',
}

const estadoPonto: Record<string, string> = {
  rascunho: 'bg-gray-400',
  em_curso: 'bg-orange-400',
  concluida: 'bg-green-500',
  assinada: 'bg-indigo-500',
}

export default function DashboardInterativo({ dadosMapa, lojasPorDistrito, visitasRecentes }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedNome, setSelectedNome] = useState<string | null>(null)

  function handleDistritoClick(id: string, nome: string) {
    if (selectedId === id) {
      setSelectedId(null)
      setSelectedNome(null)
    } else {
      setSelectedId(id)
      setSelectedNome(nome)
    }
  }

  const lojasDistrito = selectedNome ? (lojasPorDistrito[selectedNome] ?? []) : []

  // Agrupar por entidade, ordenado pelo nome da entidade
  const lojasPorEntidade: { entidade: string; lojas: LojaInfo[] }[] = []
  for (const loja of lojasDistrito) {
    const grupo = lojasPorEntidade.find(g => g.entidade === loja.entidade_nome)
    if (grupo) grupo.lojas.push(loja)
    else lojasPorEntidade.push({ entidade: loja.entidade_nome, lojas: [loja] })
  }
  lojasPorEntidade.sort((a, b) => a.entidade.localeCompare(b.entidade))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Mapa */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Distribuição geográfica</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {selectedNome ? `A ver: ${selectedNome}` : 'Clica num distrito para explorar'}
          </p>
        </div>
        <MapaPortugal
          dados={dadosMapa}
          selectedId={selectedId}
          onDistritoClick={handleDistritoClick}
        />
      </div>

      {/* Painel direito */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
        {selectedNome ? (
          /* Painel do distrito */
          <>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelectedId(null); setSelectedNome(null) }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#D41317]" />
                    {selectedNome}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lojasDistrito.length} loja{lojasDistrito.length !== 1 ? 's' : ''} registada{lojasDistrito.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Link
                href={`/dashboard/visitas?distrito=${encodeURIComponent(selectedNome)}`}
                className="flex items-center gap-1.5 text-xs text-[#D41317] hover:text-[#A50E11] font-medium transition-colors"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Ver relatórios
              </Link>
            </div>

            {lojasPorEntidade.length > 0 ? (
              <div className="overflow-y-auto max-h-96">
                {lojasPorEntidade.map(({ entidade, lojas }) => (
                  <div key={entidade}>
                    <div className="px-6 py-2 bg-gray-50 border-y border-gray-100 sticky top-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{entidade}</p>
                    </div>
                    {lojas.map(loja => (
                      <Link
                        key={loja.id}
                        href={`/dashboard/lojas/${loja.id}`}
                        className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors group border-b border-gray-50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{loja.nome}</p>
                          {loja.cidade && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{loja.cidade}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          {loja.ultimo_estado ? (
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${estadoPonto[loja.ultimo_estado] ?? 'bg-gray-300'}`} />
                              <span className="text-xs text-gray-500">
                                {estadoLabel[loja.ultimo_estado] ?? loja.ultimo_estado}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">Sem visitas</span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <MapPin className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nenhuma loja com distrito definido.</p>
                <p className="text-xs text-gray-300 mt-1">Edita as lojas para associar a este distrito.</p>
              </div>
            )}
          </>
        ) : (
          /* Visitas recentes (padrão) */
          <>
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Visitas recentes</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {visitasRecentes.length > 0 ? (
                visitasRecentes.map((visita) => (
                  <Link
                    key={visita.id}
                    href={`/dashboard/visitas/${visita.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{visita.loja_nome}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {visita.tecnico_nome} · {new Date(visita.data_visita).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoCor[visita.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                      {estadoLabel[visita.estado] ?? visita.estado}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="px-6 py-8 text-center text-sm text-gray-400">Ainda não existem visitas registadas.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
