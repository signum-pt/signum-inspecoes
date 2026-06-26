'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'

const ESTADOS = [
  { value: '', label: 'Todos os estados' },
  { value: 'agendada', label: 'Agendada' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'em_curso', label: 'Em curso' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'assinada', label: 'Assinada' },
]

const SEMESTRES = [
  { value: '', label: 'Qualquer semestre' },
  { value: 's1', label: '1º Semestre (Jan–Jun)' },
  { value: 's2', label: '2º Semestre (Jul–Dez)' },
]

const TIPOS = [
  { value: '', label: 'Semestral e extra' },
  { value: 'semestral', label: 'Apenas semestrais' },
  { value: 'extra', label: 'Apenas extras' },
]

const CAMPOS_FILTRO = [
  { chave: 'tem_pt', label: 'Tem PT', tipo: 'bool' },
  { chave: 'tem_gerador', label: 'Tem Gerador', tipo: 'bool' },
  { chave: 'tem_ups', label: 'Tem UPS', tipo: 'bool' },
  { chave: 'tem_trafo_isolamento', label: 'Tem Trafo. Isolamento', tipo: 'bool' },
  { chave: 'tem_bateria_condensadores', label: 'Tem Bat. Condensadores', tipo: 'bool' },
  { chave: 'tem_pac', label: 'Tem PAC', tipo: 'bool' },
  { chave: 'tem_upac', label: 'Tem UPAC', tipo: 'bool' },
  { chave: 'tem_pcve', label: 'Tem PCVE', tipo: 'bool' },
  { chave: 'tipo_alimentacao', label: 'Tipo de alimentação', tipo: 'texto' },
  { chave: 'tensao', label: 'Tensão', tipo: 'texto' },
  { chave: 'pt_tipo', label: 'PT — Tipo', tipo: 'texto' },
]

// Gera lista de anos: ano actual e 2 anteriores
const anoAtual = new Date().getFullYear()
const ANOS = [
  { value: '', label: 'Qualquer ano' },
  ...Array.from({ length: 3 }, (_, i) => {
    const a = anoAtual - i
    return { value: String(a), label: String(a) }
  }),
]

interface Props {
  tecnicos: { id: string; nome: string }[]
  totalResultados: number
  params: Record<string, string>
}

export default function VisitasFiltros({ tecnicos, totalResultados, params }: Props) {
  const router = useRouter()
  const [avancado, setAvancado] = useState(
    !!(params.campo || params.data_de || params.data_ate || params.tecnico_id || params.semestre || params.ano || params.tipo)
  )
  const [campoCh, setCampoCh] = useState(params.campo ?? '')
  const [campoValor, setCampoValor] = useState(params.campo_valor ?? '')

  const campoInfo = CAMPOS_FILTRO.find(c => c.chave === campoCh)
  const temFiltros = Object.keys(params).some(k => params[k])

  const inputCls = "px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D41317] bg-white"

  function handleCampoChange(chave: string) {
    setCampoCh(chave)
    setCampoValor('')
  }

  return (
    <form method="GET" action="/dashboard/visitas" className="space-y-3 mb-6">
      {/* Linha principal */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Pesquisar por loja..."
            className={`${inputCls} w-full pl-9`}
          />
        </div>

        <select name="estado" defaultValue={params.estado ?? ''} className={inputCls}>
          {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>

        <button type="submit"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: '#D41317' }}>
          Pesquisar
        </button>

        <button
          type="button"
          onClick={() => setAvancado(v => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${avancado ? 'border-[#D41317] text-[#D41317] bg-red-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          <SlidersHorizontal className="w-4 h-4" />
          Avançado
        </button>

        {temFiltros && (
          <button type="button"
            onClick={() => router.push('/dashboard/visitas')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
            Limpar
          </button>
        )}
      </div>

      {/* Filtros avançados */}
      {avancado && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 grid grid-cols-2 gap-3 md:grid-cols-4">

          {/* Tipo de visita */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo de visita</label>
            <select name="tipo" defaultValue={params.tipo ?? ''} className={`${inputCls} w-full`}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Ano */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ano</label>
            <select name="ano" defaultValue={params.ano ?? ''} className={`${inputCls} w-full`}>
              {ANOS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>

          {/* Semestre */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Semestre</label>
            <select name="semestre" defaultValue={params.semestre ?? ''} className={`${inputCls} w-full`}>
              {SEMESTRES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Técnico */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Técnico</label>
            <select name="tecnico_id" defaultValue={params.tecnico_id ?? ''} className={`${inputCls} w-full`}>
              <option value="">Todos</option>
              {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>

          {/* Datas manuais */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data de</label>
            <input type="date" name="data_de" defaultValue={params.data_de ?? ''} className={`${inputCls} w-full`} />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Data até</label>
            <input type="date" name="data_ate" defaultValue={params.data_ate ?? ''} className={`${inputCls} w-full`} />
          </div>

          {/* Campo da instalação */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Campo da instalação</label>
            <select
              name="campo"
              value={campoCh}
              onChange={e => handleCampoChange(e.target.value)}
              className={`${inputCls} w-full`}>
              <option value="">Nenhum</option>
              {CAMPOS_FILTRO.map(c => <option key={c.chave} value={c.chave}>{c.label}</option>)}
            </select>
          </div>

          {campoInfo && (
            <div className="col-span-2 md:col-span-4">
              <label className="block text-xs text-gray-500 mb-1">Valor — {campoInfo.label}</label>
              {campoInfo.tipo === 'bool' ? (
                <div className="flex gap-2">
                  {[{ v: 'true', l: 'Sim' }, { v: 'false', l: 'Não' }].map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setCampoValor(opt.v)}
                      className={`px-5 py-2 rounded-lg text-sm border transition-colors ${
                        campoValor === opt.v
                          ? opt.v === 'true' ? 'border-green-400 bg-green-50 text-green-700 font-medium' : 'border-red-300 bg-red-50 text-red-700 font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  defaultValue={params.campo_valor ?? ''}
                  onChange={e => setCampoValor(e.target.value)}
                  placeholder={campoInfo.chave === 'tipo_alimentacao' ? 'ex: Trifásico' : campoInfo.chave === 'pt_tipo' ? 'ex: AI' : 'ex: 400V'}
                  className={`${inputCls} w-full max-w-xs`}
                />
              )}
              <input type="hidden" name="campo_valor" value={campoValor} />
            </div>
          )}
        </div>
      )}

      {temFiltros && (
        <p className="text-xs text-gray-500">{totalResultados} resultado{totalResultados !== 1 ? 's' : ''} encontrado{totalResultados !== 1 ? 's' : ''}</p>
      )}
    </form>
  )
}
