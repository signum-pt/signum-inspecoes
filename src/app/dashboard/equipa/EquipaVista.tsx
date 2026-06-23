'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react'
import MapaTecnicos, { type TecnicoDistrito, CORES_TECNICOS } from './MapaTecnicos'

const estadoLabel: Record<string, string> = {
  agendada: 'Agendada', rascunho: 'Rascunho', em_curso: 'Em curso',
  concluida: 'Concluída', assinada: 'Assinada',
}
const estadoCor: Record<string, string> = {
  agendada: 'bg-blue-100 text-blue-700',
  rascunho: 'bg-gray-100 text-gray-600',
  em_curso: 'bg-orange-100 text-orange-700',
  concluida: 'bg-green-100 text-green-700',
  assinada: 'bg-indigo-100 text-indigo-700',
}

interface Props {
  data: string
  tecnicos: TecnicoDistrito[]
  tecnicosSemVisitas: { id: string; nome: string }[]
}

export default function EquipaVista({ data, tecnicos, tecnicosSemVisitas }: Props) {
  const router = useRouter()
  const [hoveredDistrito, setHoveredDistrito] = useState<string | null>(null)

  function navegar(delta: number) {
    const d = new Date(data + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    router.push(`/dashboard/equipa?data=${d.toISOString().split('T')[0]}`)
  }

  const dataObj = new Date(data + 'T12:00:00')
  const hoje = new Date().toISOString().split('T')[0]
  const isHoje = data === hoje

  const dataFormatada = dataObj.toLocaleDateString('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Técnicos destacados pelo hover no mapa
  const tecnicosDestacados = hoveredDistrito
    ? tecnicos.filter(t => t.distritos.includes(hoveredDistrito))
    : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Mapa */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Localização da equipa</h2>
          <p className="text-xs text-gray-400 mt-0.5">Baseado em visitas {isHoje ? 'de hoje' : 'do dia selecionado'}</p>
        </div>

        <MapaTecnicos tecnicos={tecnicos} onDistritoHover={setHoveredDistrito} />

        {/* Legenda técnicos */}
        {tecnicos.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {tecnicos.map(t => (
              <div key={t.tecnico_id} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.cor }} />
                <span className="text-xs text-gray-600 truncate">{t.tecnico_nome}</span>
                <span className="text-xs text-gray-300 ml-auto flex-shrink-0">
                  {t.distritos.length > 0 ? t.distritos.join(', ') : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de técnicos */}
      <div className="lg:col-span-2 space-y-4">
        {tecnicos.length === 0 && tecnicosSemVisitas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            <p className="text-sm">Sem dados para este dia.</p>
          </div>
        ) : (
          <>
            {/* Com visitas */}
            {tecnicos.map(t => {
              const destacado = tecnicosDestacados?.some(td => td.tecnico_id === t.tecnico_id) ?? false
              return (
                <div key={t.tecnico_id}
                  className={`bg-white rounded-xl border transition-all ${destacado ? 'border-gray-400 shadow-sm' : 'border-gray-200'}`}>
                  {/* Cabeçalho técnico */}
                  <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: t.cor }}>
                      {t.tecnico_nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{t.tecnico_nome}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t.visitas.length} visita{t.visitas.length !== 1 ? 's' : ''} · {
                          t.distritos.length > 0
                            ? t.distritos.join(' · ')
                            : 'Sem localização definida'
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {t.distritos.map(d => (
                        <span key={d} className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: t.cor + '20', color: t.cor }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Visitas do dia */}
                  <div className="divide-y divide-gray-50">
                    {t.visitas.map((v, i) => (
                      <div key={i} className="px-5 py-3 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{v.loja_nome}</p>
                          {v.distrito && (
                            <p className="text-xs text-gray-400 mt-0.5">{v.distrito}</p>
                          )}
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${estadoCor[v.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                          {estadoLabel[v.estado] ?? v.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Sem visitas hoje */}
            {tecnicosSemVisitas.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sem visitas neste dia</p>
                <div className="flex flex-wrap gap-2">
                  {tecnicosSemVisitas.map(t => (
                    <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                        {t.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-500">{t.nome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function EquipaNav({ data }: { data: string }) {
  const router = useRouter()

  function navegar(delta: number) {
    const d = new Date(data + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    router.push(`/dashboard/equipa?data=${d.toISOString().split('T')[0]}`)
  }

  function irParaHoje() {
    router.push(`/dashboard/equipa?data=${new Date().toISOString().split('T')[0]}`)
  }

  const dataObj = new Date(data + 'T12:00:00')
  const hoje = new Date().toISOString().split('T')[0]
  const isHoje = data === hoje

  const dataFormatada = dataObj.toLocaleDateString('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="flex items-center gap-3">
      <button onClick={() => navegar(-1)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <input
        type="date"
        value={data}
        onChange={e => router.push(`/dashboard/equipa?data=${e.target.value}`)}
        className="text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#D41317]"
      />
      <button onClick={() => navegar(1)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
        <ChevronRight className="w-5 h-5" />
      </button>
      {!isHoje && (
        <button onClick={irParaHoje}
          className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
          Hoje
        </button>
      )}
      <span className="text-sm text-gray-400 capitalize hidden sm:block">{dataFormatada}</span>
    </div>
  )
}
